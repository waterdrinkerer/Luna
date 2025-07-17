import { useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'

const BottomNav = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [active, setActive] = useState('home')

  useEffect(() => {
    if (location.pathname.includes('lounge')) setActive('lounge')
    else if (location.pathname.includes('cycles')) setActive('cycles')
    else if (location.pathname.includes('mooniebot')) setActive('mooniebot')
    else setActive('home')
  }, [location])

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white shadow-inner flex justify-around items-center h-16 z-50">
      <button
        onClick={() => navigate('/home')}
        className={`flex flex-col items-center text-xs ${active === 'home' ? 'text-purple-600' : 'text-gray-500'}`}
      >
        <span>🏠</span>
        <span>Home</span>
      </button>
      <button
        onClick={() => navigate('/lounge')}
        className={`flex flex-col items-center text-xs ${active === 'lounge' ? 'text-purple-600' : 'text-gray-500'}`}
      >
        <span>📚</span>
        <span>Lounge</span>
      </button>
      <button
        onClick={() => navigate('/my-reports')}
        className={`flex flex-col items-center text-xs ${active === 'cycles' ? 'text-purple-600' : 'text-gray-500'}`}
      >
        <span>📈</span>
        <span>Cycles</span>
      </button>
      <button
        onClick={() => navigate('/mooniebot')}
        className={`flex flex-col items-center text-xs ${active === 'mooniebot' ? 'text-purple-600' : 'text-gray-500'}`}
      >
        <span>🤖</span>
        <span>Moonie</span>
      </button>
    </nav>
  )
}

export default BottomNav
