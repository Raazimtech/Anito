const SUPABASE_URL = 'https://dpiwdhtbhwjgatvcfkcb.supabase.co';
const SUPABASE_KEY = 'sb_publishable_PSZnTEo74jObih_6TTpXVQ_tJwzTnXY';
const { createClient } = window.supabase;
const db = createClient(SUPABASE_URL, SUPABASE_KEY);

const $ = (s) => document.querySelector(s);
const state = { user:null, profile:null, conversation:null, other:null, realtime:[], authMode:'login', conversations:[] };

function toast(message, kind='info') { const el=$('#toast'); el.textContent=message; el.className=`toast show ${kind}`; clearTimeout(window.__toast); window.__toast=setTimeout(()=>el.className='toast',3200); }
function esc(v='') { return String(v).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
function initials(name='N') { return esc(name.trim().slice(0,1).toUpperCase() || 'N'); }
function setBusy(btn,busy,label){btn.disabled=busy;btn.dataset.original??=btn.textContent;if(busy)btn.textContent=label||'Please wait…';else btn.textContent=btn.dataset.original;}

function setAuthMode(mode){
  state.authMode=mode;
  const signup=mode==='signup';
  $('#auth-title').textContent=signup?'Create your account.':'Welcome back.';
  $('#auth-subtitle').textContent=signup?'Pick a unique username and make your private space.':'Sign in to your conversations and files.';
  $('#username-field').hidden=!signup; $('#display-field').hidden=!signup;
  $('#username').required=signup; $('#display-name').required=false;
  $('#auth-submit').textContent=signup?'Create account':'Sign in';
  $('#auth-toggle').textContent=signup?'Already have an account? Sign in':'Create an account';
}

async function init(){
  setAuthMode('login');
  bindAuth();
  bindApp();
  const {data:{session}}=await db.auth.getSession();
  if(session) await enterApp(session.user); else showAuth();
  db.auth.onAuthStateChange(async (_event,session)=>{ if(session?.user && !state.user) await enterApp(session.user); if(!session) showAuth(); });
}
function showAuth(){ $('#auth').classList.remove('hidden'); $('#app').classList.add('hidden'); state.user=null; state.profile=null; state.conversation=null; }
async function enterApp(user){
  state.user=user;
  const {data:profile,error}=await db.from('nuvio_profiles').select('*').eq('id',user.id).single();
  if(error){ toast(error.message,'error'); return; }
  state.profile=profile; $('#auth').classList.add('hidden'); $('#app').classList.remove('hidden'); renderProfile(); await loadConversations(); subscribeRealtime();
}
function renderProfile(){ const text=`${state.profile.display_name||state.profile.username} · @${state.profile.username}`; $('#profile-btn').textContent=text; $('#mobile-profile').title=text; }

function bindAuth(){
  $('#auth-toggle').onclick=()=>setAuthMode(state.authMode==='login'?'signup':'login');
  $('#auth-form').onsubmit=async e=>{
    e.preventDefault(); const btn=$('#auth-submit'); setBusy(btn,true,'Connecting…');
    try{
      const email=$('#email').value.trim(), password=$('#password').value, username=$('#username').value.trim(), display=$('#display-name').value.trim();
      if(state.authMode==='signup'){
        if(!/^[A-Za-z0-9_]{3,24}$/.test(username)) throw new Error('Username must be 3–24 characters using letters, numbers or _.');
        const {data,error}=await db.auth.signUp({email,password,options:{data:{username,display_name:display||username}}});
        if(error) throw error;
        if(!data.session) toast('Account created. Check your email if confirmation is enabled.','success'); else toast('Welcome to Nuvio.','success');
      } else { const {error}=await db.auth.signInWithPassword({email,password}); if(error) throw error; }
    }catch(err){ toast(normalizeError(err),'error'); } finally{ setBusy(btn,false); }
  };
}
function normalizeError(err){ const m=err?.message||String(err); if(m.includes('USERNAME_TAKEN')||m.toLowerCase().includes('duplicate key')) return 'That username is already taken.'; return m; }

function bindApp(){
  $('#signout').onclick=()=>db.auth.signOut();
  $('#new-chat').onclick=()=>openSearch(); $('#search-btn').onclick=()=>openSearch(); $('#welcome-search').onclick=()=>openSearch();
  $('#back-mobile').onclick=()=>{ $('#chat').classList.add('hidden'); $('#welcome').classList.remove('hidden'); state.conversation=null; };
  $('#profile-btn').onclick=showProfile; $('#mobile-profile').onclick=showProfile;
  $('#composer').onsubmit=sendText; $('#attach').onclick=()=>$('#file-input').click(); $('#file-input').onchange=uploadFile;
}

async function loadConversations(){
  const {data:members,error}=await db.from('nuvio_conversation_members').select('conversation_id,user_id').eq('user_id',state.user.id);
  if(error){toast(error.message,'error');return;}
  state.conversations=[];
  for(const m of members||[]){
    const {data:all}=await db.from('nuvio_conversation_members').select('user_id,nuvio_profiles(username,display_name,avatar_url)').eq('conversation_id',m.conversation_id);
    const other=(all||[]).find(x=>x.user_id!==state.user.id);
    const {data:conv}=await db.from('nuvio_conversations').select('id,updated_at').eq('id',m.conversation_id).single();
    if(other) state.conversations.push({id:m.conversation_id,updated_at:conv?.updated_at||'',other:other.nuvio_profiles});
  }
  state.conversations.sort((a,b)=>new Date(b.updated_at)-new Date(a.updated_at)); renderConversations(); await loadRequests();
}
function renderConversations(){
  const el=$('#conversation-list'); if(!state.conversations.length){el.innerHTML='<div class="empty-side">No conversations yet.<br><small>Find someone to get started.</small></div>';return;}
  el.innerHTML=state.conversations.map(c=>`<button class="conversation-item ${state.conversation?.id===c.id?'active':''}" data-cid="${c.id}"><span class="avatar small">${initials(c.other.display_name||c.other.username)}</span><span><b>${esc(c.other.display_name||c.other.username)}</b><small>@${esc(c.other.username)}</small></span></button>`).join('');
  el.querySelectorAll('[data-cid]').forEach(b=>b.onclick=()=>openConversation(b.dataset.cid));
}

async function loadRequests(){
  const {data:incoming}=await db.from('nuvio_chat_requests').select('id,sender_id,status,created_at,nuvio_profiles!nuvio_chat_requests_sender_id_fkey(username,display_name,avatar_url)').eq('recipient_id',state.user.id).eq('status','pending').order('created_at',{ascending:false});
  window.__incoming=incoming||[];
}

async function openConversation(id){
  const c=state.conversations.find(x=>x.id===id); if(!c)return;
  state.conversation=c; state.other=c.other; renderConversations(); $('#welcome').classList.add('hidden'); $('#chat').classList.remove('hidden');
  $('#chat-name').textContent=c.other.display_name||c.other.username; $('#chat-username').textContent='@'+c.other.username; $('#chat-avatar').textContent=initials(c.other.display_name||c.other.username); await loadMessages();
}
async function loadMessages(){
  if(!state.conversation)return;
  const {data,error}=await db.from('nuvio_messages').select('id,conversation_id,sender_id,body,message_type,created_at,nuvio_attachments(id,file_name,mime_type,size_bytes,storage_path)').eq('conversation_id',state.conversation.id).order('created_at',{ascending:true});
  if(error){toast(error.message,'error');return;} renderMessages(data||[]);
}
function renderMessages(messages){
  const el=$('#messages'); if(!messages.length){el.innerHTML='<div class="empty-chat"><div>✦</div><b>Start the conversation</b><span>Messages and shared files stay inside this private chat.</span></div>';return;}
  el.innerHTML=messages.map(m=>{const mine=m.sender_id===state.user.id;const a=m.nuvio_attachments?.[0];const file=a?`<button class="file-card" data-path="${esc(a.storage_path)}" data-name="${esc(a.file_name)}"><span class="file-icon">${a.mime_type?.startsWith('image/')?'▧':'⌁'}</span><span><b>${esc(a.file_name)}</b><small>${formatBytes(a.size_bytes)}</small></span></button>`:'';const body=m.body?`<div class="bubble-text">${esc(m.body).replace(/\n/g,'<br>')}</div>`:'';return `<article class="message ${mine?'mine':''}"><div class="bubble">${body}${file}<time>${new Date(m.created_at).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</time></div></article>`}).join('');
  el.scrollTop=el.scrollHeight; el.querySelectorAll('.file-card').forEach(b=>b.onclick=()=>downloadFile(b.dataset.path,b.dataset.name));
}
function formatBytes(n){if(!n)return '';const units=['B','KB','MB','GB'];let i=0,x=n;while(x>=1024&&i<units.length-1){x/=1024;i++;}return `${x<10&&i?x.toFixed(1):Math.round(x)} ${units[i]}`;}
async function sendText(e){e.preventDefault();const input=$('#message-input'),body=input.value.trim();if(!body||!state.conversation)return;input.value='';const {error}=await db.from('nuvio_messages').insert({conversation_id:state.conversation.id,sender_id:state.user.id,body,message_type:'text'});if(error){toast(error.message,'error');input.value=body;} }
async function uploadFile(){const file=$('#file-input').files[0];$('#file-input').value='';if(!file||!state.conversation)return;if(file.size>50*1024*1024){toast('Files are limited to 50 MB.','error');return;}const safe=file.name.replace(/[^a-zA-Z0-9._-]/g,'_');const path=`${state.conversation.id}/${state.user.id}/${crypto.randomUUID()}-${safe}`;toast('Uploading…');const {error:up}=await db.storage.from('nuvio-files').upload(path,file,{contentType:file.type||'application/octet-stream',upsert:false});if(up){toast(up.message,'error');return;}const {data:msg,error:me}=await db.from('nuvio_messages').insert({conversation_id:state.conversation.id,sender_id:state.user.id,body:file.name,message_type:file.type?.startsWith('image/')?'image':'file'}).select('id').single();if(me){toast(me.message,'error');return;}const {error:ae}=await db.from('nuvio_attachments').insert({message_id:msg.id,conversation_id:state.conversation.id,uploader_id:state.user.id,storage_path:path,file_name:file.name,mime_type:file.type||'application/octet-stream',size_bytes:file.size});if(ae)toast(ae.message,'error');}
async function downloadFile(path,name){const {data,error}=await db.storage.from('nuvio-files').createSignedUrl(path,300);if(error){toast(error.message,'error');return;}window.open(data.signedUrl,'_blank','noopener');}

function openSearch(){
  $('#modal').classList.remove('hidden'); $('#modal').innerHTML=`<div class="modal-backdrop"><div class="modal-card"><div class="modal-head"><div><span class="eyebrow">PEOPLE</span><h2>Find someone</h2></div><button class="icon-button" id="close-modal">×</button></div><div class="search-box"><span>⌕</span><input id="people-search" autofocus placeholder="Search username…"></div><div id="people-results" class="people-results"><div class="muted">Type at least 2 characters.</div></div><div id="request-panel"></div></div></div>`;
  $('#close-modal').onclick=closeModal; $('#people-search').oninput=debounce(searchPeople,250); $('#people-search').focus();
}
function closeModal(){ $('#modal').classList.add('hidden'); $('#modal').innerHTML=''; }
function debounce(fn,wait){let t;return(...a)=>{clearTimeout(t);t=setTimeout(()=>fn(...a),wait)}}
async function searchPeople(){const q=$('#people-search').value.trim();const el=$('#people-results');if(q.length<2){el.innerHTML='<div class="muted">Type at least 2 characters.</div>';return;}const {data,error}=await db.from('nuvio_profiles').select('id,username,display_name,avatar_url').ilike('username',`%${q}%`).neq('id',state.user.id).limit(20);if(error){el.innerHTML=`<div class="error-text">${esc(error.message)}</div>`;return;}if(!data?.length){el.innerHTML='<div class="muted">No users found.</div>';return;}el.innerHTML=data.map(p=>`<div class="person-result"><span class="avatar">${initials(p.display_name||p.username)}</span><div><b>${esc(p.display_name||p.username)}</b><small>@${esc(p.username)}</small></div><button class="secondary request-btn" data-user="${p.id}" data-name="${esc(p.username)}">Chat</button></div>`).join('');el.querySelectorAll('.request-btn').forEach(b=>b.onclick=()=>sendRequest(b.dataset.user,b));}
async function sendRequest(recipient,btn){setBusy(btn,true,'Sending…');const {error}=await db.from('nuvio_chat_requests').insert({sender_id:state.user.id,recipient_id:recipient});if(error){toast(error.message.includes('duplicate')?'A request already exists.':error.message,'error');setBusy(btn,false);return;}btn.textContent='Requested';btn.disabled=true;toast('Chat request sent.','success');}

async function showProfile(){
  $('#modal').classList.remove('hidden'); $('#modal').innerHTML=`<div class="modal-backdrop"><div class="modal-card profile-card"><div class="modal-head"><div><span class="eyebrow">YOUR ACCOUNT</span><h2>Profile</h2></div><button class="icon-button" id="close-modal">×</button></div><div class="profile-hero"><span class="avatar huge">${initials(state.profile.display_name||state.profile.username)}</span><div><h3>${esc(state.profile.display_name||state.profile.username)}</h3><span>@${esc(state.profile.username)}</span></div></div><div class="request-section"><h3>Incoming requests</h3><div id="requests-list"></div></div></div></div>`;
  $('#close-modal').onclick=closeModal; const {data,error}=await db.from('nuvio_chat_requests').select('id,sender_id,created_at,nuvio_profiles!nuvio_chat_requests_sender_id_fkey(username,display_name)').eq('recipient_id',state.user.id).eq('status','pending').order('created_at',{ascending:false});const el=$('#requests-list');if(error){el.innerHTML=`<div class="error-text">${esc(error.message)}</div>`;return;}if(!data?.length){el.innerHTML='<div class="muted">No pending requests.</div>';return;}el.innerHTML=data.map(r=>`<div class="person-result"><span class="avatar">${initials(r.nuvio_profiles.display_name||r.nuvio_profiles.username)}</span><div><b>${esc(r.nuvio_profiles.display_name||r.nuvio_profiles.username)}</b><small>@${esc(r.nuvio_profiles.username)}</small></div><div class="request-actions"><button class="primary accept" data-id="${r.id}">Accept</button><button class="ghost reject" data-id="${r.id}">Decline</button></div></div>`).join('');el.querySelectorAll('.accept').forEach(b=>b.onclick=()=>respondRequest(b.dataset.id,true));el.querySelectorAll('.reject').forEach(b=>b.onclick=()=>respondRequest(b.dataset.id,false));
}
async function respondRequest(id,accept){const {data,error}=await db.rpc(accept?'nuvio_accept_request':'nuvio_reject_request',{p_request_id:id});if(error){toast(error.message,'error');return;}toast(accept?'Conversation created.':'Request declined.',accept?'success':'info');closeModal();await loadConversations();if(accept&&data)openConversation(data);}
function subscribeRealtime(){state.realtime.forEach(x=>db.removeChannel(x));state.realtime=[];const ch=db.channel('nuvio-live').on('postgres_changes',{event:'INSERT',schema:'public',table:'nuvio_messages'},payload=>{if(state.conversation?.id===payload.new.conversation_id)loadMessages();else loadConversations();}).on('postgres_changes',{event:'*',schema:'public',table:'nuvio_chat_requests',filter:`recipient_id=eq.${state.user.id}`},()=>loadConversations()).subscribe();state.realtime.push(ch);}

function showProfileMenu(){ }
window.addEventListener('load',init);
