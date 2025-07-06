import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import countdownImg from '../assets/widget_countdown.png'
import periodImg from '../assets/widget_period.png'
import follicularImg from '../assets/widget_follicular.png'
import ovulationImg from '../assets/widget_ovulation.png'
import lutealImg from '../assets/widget_luteal.png'
import pmsImg from '../assets/widget_pms.png'


// Phase styles and assets
const PHASE_STYLES: Record<string, { bgColor: string; text: string; subtext: string; image: string }> = {
  countdown: {
    bgColor: '#6345FE',
    text: 'Period in,',
    subtext: 'Lower chance to get pregnant',
    image: countdownImg,
  },
  period: {
    bgColor: '#DA4949',
    text: 'Day 1',
    subtext: 'Don’t forget to log your flow',
    image: periodImg,
  },
  follicular: {
    bgColor: '#C8B6FF',
    text: 'Follicular Phase',
    subtext: 'You might feel more energetic',
    image: follicularImg,
  },
  ovulation: {
    bgColor: '#23273D',
    text: 'Ovulation',
    subtext: 'High chance to get pregnant',
    image: ovulationImg,
  },
  ovulationWindow: {
    bgColor: '#2A58CD',
    text: 'Day 1',
    subtext: 'High chance to get pregnant',
    image: ovulationImg,
  },
  luteal: {
    bgColor: '#FDCB6E',
    text: 'Your body is winding down.',
    subtext: 'Take it easy.',
    image: lutealImg,
  },
  pms: {
    bgColor: '#646380',
    text: 'Cravings or mood swings?',
    subtext: 'You’re not alone <3',
    image: pmsImg,
  },
}


const Home = () => {
  const navigate = useNavigate()
  const [userName, setUserName] = useState('Jessie') // Replace with actual username
  const [profilePic, setProfilePic] = useState('/assets/profile-placeholder.jpg') // Replace with actual profile image

  // For now, let's assume current phase is hardcoded
  const currentPhase = 'countdown' // This can be updated from backend/model
  const daysLeft = 5 // Example value, also model-derived

  const { bgColor, text, subtext, image } = PHASE_STYLES[currentPhase]

  return (
    <div className="min-h-screen bg-[#F4F1FA] flex flex-col gap-6 p-4 pb-24 overflow-y-auto">
      {/* Section 1: Greeting & Profile */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-lg font-medium text-purple-800">Good Morning,</p>
          <h1 className="text-2xl font-bold">{userName} !</h1>
        </div>
        <img
          src={profilePic}
          alt="Profile"
          className="w-12 h-12 rounded-full object-cover border cursor-pointer"
          onClick={() => navigate('/profile')}
        />
      </div>

      {/* Section 2: Cycle Countdown Widget */}
      <div
        className="rounded-xl p-4 flex justify-between items-center text-white cursor-pointer"
        style={{ backgroundColor: bgColor }}
        onClick={() => navigate('/calendar')}
      >
        <div>
          <p className="text-sm font-medium">{text}</p>
          <p className="text-3xl font-bold">{daysLeft} Days</p>
          <p className="text-xs mt-1 opacity-90">{subtext}</p>
        </div>
        <img src={image} alt="Phase icon" className="w-16 h-16 object-contain" />
      </div>
    </div>
  )
}

export default Home
