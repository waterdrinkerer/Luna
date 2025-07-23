interface CyclePhaseWidgetProps {
  phase: string
  message: string
  subtext?: string
  daysLeft?: string
  color: string
  icon: string
}

const CyclePhaseWidget = ({
  phase,
  message,
  subtext,
  daysLeft,
  color,
  icon
}: CyclePhaseWidgetProps) => {
  return (
    <div
      className="rounded-xl p-4 text-white flex justify-between items-center"
      style={{ backgroundColor: color }}
    >
      <div>
        <p className="text-sm font-medium">{phase}</p>
        <h3 className="text-3xl font-bold">{daysLeft || message}</h3>
        {subtext && <p className="text-xs mt-1">{subtext}</p>}
      </div>
      <img src={icon} alt={phase} className="w-16 h-16 object-contain" />
    </div>
  )
}

export default CyclePhaseWidget
