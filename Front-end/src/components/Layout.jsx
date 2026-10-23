import { Outlet } from 'react-router-dom'
import Navbar from './Navbar.jsx'
import TopBar from './TopBar.jsx'
import { ComTopBar } from './layoutContext.js'

// No celular a navegação é a Navbar, embaixo; a partir de lg ela some e entra a
// TopBar, no topo.
function Layout() {
  return (
    <ComTopBar.Provider value={true}>
      <TopBar />
      <Outlet />
      {/* As páginas já reservam o espaço da barra (pb-28); isto soma a área do
          indicador de início do iPhone, onde a barra sobe para não ficar em cima. */}
      <div aria-hidden="true" className="h-[env(safe-area-inset-bottom)] lg:hidden" />
      <Navbar />
    </ComTopBar.Provider>
  )
}

export default Layout
