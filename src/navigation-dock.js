export function installNavigationDock(app){
  if(document.querySelector('.ciwaan-floating-dock')) return
  const dock=document.createElement('nav')
  dock.className='ciwaan-floating-dock'
  dock.setAttribute('aria-label','Primary navigation')
  dock.innerHTML=`
    <button class="dock-item" data-screen="home" aria-label="Home"><span class="dock-icon">⌂</span><span>Home</span></button>
    <button class="dock-create" aria-label="Create Ciwaan"><span>+</span></button>
    <button class="dock-item" data-screen="explore" aria-label="Explore"><span class="dock-icon">⌖</span><span>Explore</span></button>
  `
  document.body.appendChild(dock)

  const proxy=()=>app?._instance?.proxy
  const go=(screen)=>{
    const p=proxy(); if(!p) return
    if(screen==='home' && typeof p.goHome==='function') p.goHome();
    else p.screen=screen
    if(screen==='explore' && typeof p.initExploreMap==='function') setTimeout(()=>p.initExploreMap(),80)
    window.scrollTo({top:0,behavior:'smooth'})
  }

  dock.querySelector('[data-screen="home"]').addEventListener('click',()=>go('home'))
  dock.querySelector('[data-screen="explore"]').addEventListener('click',()=>go('explore'))
  dock.querySelector('.dock-create').addEventListener('click',()=>{
    const p=proxy();
    if(p && typeof p.startCreate==='function') p.startCreate()
  })

  const update=()=>{
    const root=document.querySelector('#app > .app')
    const map=root?.classList.contains('is-map-mode')
    dock.classList.toggle('dock-hidden',!!map)
    const p=proxy()
    const screen=p?.screen
    dock.querySelectorAll('[data-screen]').forEach(b=>b.classList.toggle('active',b.dataset.screen===screen))
  }
  const observer=new MutationObserver(update)
  const root=document.querySelector('#app')
  if(root) observer.observe(root,{subtree:true,attributes:true,attributeFilter:['class']})
  setInterval(update,500)
  update()
}
