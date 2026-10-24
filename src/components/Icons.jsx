import {
  ArrowCounterClockwise, ArrowSquareOut, Buildings, Camera, CaretRight, CheckCircle,
  Circuitry, Code, Cpu, Cube, Eye, Factory, Funnel, GearSix, GraduationCap, Info,
  Crosshair, MagnifyingGlass, MapPin, PlayCircle, Robot, ShieldCheck, Sparkle, UserCircle,
  VideoCamera, WarningCircle, Wrench, X,
} from '@phosphor-icons/react'

const ICONS = {
  search: MagnifyingGlass,
  pin: MapPin,
  filter: Funnel,
  close: X,
  external: ArrowSquareOut,
  play: PlayCircle,
  reset: ArrowCounterClockwise,
  chevron: CaretRight,
  info: Info,
  video: VideoCamera,
  shield: ShieldCheck,
  owner: UserCircle,
  ai: Sparkle,
  verified: CheckCircle,
  warning: WarningCircle,
  motor: GearSix,
  sensor: Crosshair,
  camera: Camera,
  vision: Eye,
  solution: Buildings,
  control: Circuitry,
  transmission: Wrench,
  chip: Cpu,
  robot: Robot,
  software: Code,
  education: GraduationCap,
  other: Cube,
  factory: Factory,
}

export function Icon({ name, size = 20, className = '', weight = 'regular' }) {
  const Component = ICONS[name] || Cube
  return <Component aria-hidden="true" className={className} size={size} weight={weight} />
}
