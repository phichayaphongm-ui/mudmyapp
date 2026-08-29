// Sound utility functions using Web Audio API
// This allows us to generate sounds without external audio files

export type SoundType =
  | 'default'
  | 'chime'
  | 'notification'
  | 'gentle'
  | 'pop'
  | 'bubble'
  | 'marimba'
  | 'ping'
  | 'message'
  | 'alert'
  | 'crystal'
  | 'wood'

export const SOUND_OPTIONS: { id: SoundType; name: string }[] = [
  { id: 'default', name: 'เสียงเริ่มต้น' },
  { id: 'chime', name: 'เสียงกระดิ่ง' },
  { id: 'notification', name: 'เสียงแจ้งเตือน' },
  { id: 'gentle', name: 'เสียงนุ่มนวล' },
  { id: 'message', name: 'เสียงข้อความ' },
  { id: 'pop', name: 'เสียงป๊อป' },
  { id: 'bubble', name: 'เสียงฟอง' },
  { id: 'marimba', name: 'เสียงมาริมบา' },
  { id: 'ping', name: 'เสียงปิง' },
  { id: 'crystal', name: 'เสียงคริสตัล' },
  { id: 'wood', name: 'เสียงเคาะไม้' },
  { id: 'alert', name: 'เสียงเตือนสั้น' },
]

const STORAGE_KEY = 'mudmy_sound_settings'
const SOUND_TYPES: SoundType[] = SOUND_OPTIONS.map((s) => s.id)

type StoredSoundSettings = {
  enabled: boolean
  type: SoundType
  volume: number
}

class SoundManager {
  private audioContext: AudioContext | null = null
  private enabled: boolean = true
  private currentSoundType: SoundType = 'default'
  private volume: number = 0.5
  private loaded = false

  constructor() {
    if (typeof window !== 'undefined') {
      this.ensureLoaded()
    }
  }

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
    return this.audioContext
  }

  async unlock() {
    const ctx = this.getContext()
    if (!ctx) return
    if (ctx.state === 'suspended') {
      try {
        await ctx.resume()
      } catch {
        // Browser may still require a user gesture
      }
    }
  }

  ensureLoaded() {
    if (this.loaded || typeof window === 'undefined') return
    this.loaded = true
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw) as Partial<StoredSoundSettings>
      if (typeof parsed.enabled === 'boolean') this.enabled = parsed.enabled
      if (parsed.type && SOUND_TYPES.includes(parsed.type)) this.currentSoundType = parsed.type
      if (typeof parsed.volume === 'number') this.volume = Math.max(0, Math.min(1, parsed.volume))
    } catch {
      // ignore invalid stored settings
    }
  }

  private persist() {
    if (typeof window === 'undefined') return
    const payload: StoredSoundSettings = {
      enabled: this.enabled,
      type: this.currentSoundType,
      volume: this.volume,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled
    this.persist()
  }

  setSoundType(soundType: SoundType) {
    this.currentSoundType = SOUND_TYPES.includes(soundType) ? soundType : 'default'
    this.persist()
  }

  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume))
    this.persist()
  }

  isEnabled(): boolean {
    return this.enabled
  }

  getSoundType(): SoundType {
    return this.currentSoundType
  }

  getVolume(): number {
    return this.volume
  }

  private playTone(frequency: number, duration: number, baseVolume: number = 0.3) {
    if (!this.enabled || !this.audioContext) return

    try {
      const oscillator = this.audioContext.createOscillator()
      const gainNode = this.audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(this.audioContext.destination)

      oscillator.frequency.value = frequency
      oscillator.type = 'sine'

      const adjustedVolume = baseVolume * this.volume
      gainNode.gain.setValueAtTime(adjustedVolume, this.audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration)

      oscillator.start(this.audioContext.currentTime)
      oscillator.stop(this.audioContext.currentTime + duration)
    } catch (error) {
      console.error('Error playing tone:', error)
    }
  }

  private playSequence(
    notes: Array<{
      freq: number
      start?: number
      duration: number
      type?: OscillatorType
      vol?: number
    }>
  ) {
    if (!this.enabled || !this.audioContext) return
    const ctx = this.audioContext
    const now = ctx.currentTime

    try {
      notes.forEach((note) => {
        const oscillator = ctx.createOscillator()
        const gainNode = ctx.createGain()
        oscillator.connect(gainNode)
        gainNode.connect(ctx.destination)
        oscillator.frequency.value = note.freq
        oscillator.type = note.type ?? 'sine'
        const startTime = now + (note.start ?? 0)
        const duration = note.duration
        const adjustedVolume = (note.vol ?? 0.18) * this.volume
        gainNode.gain.setValueAtTime(0, startTime)
        gainNode.gain.linearRampToValueAtTime(adjustedVolume, startTime + Math.min(0.04, duration / 4))
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration)
        oscillator.start(startTime)
        oscillator.stop(startTime + duration)
      })
    } catch (error) {
      console.error('Error playing sequence:', error)
    }
  }

  private playChime() {
    this.playSequence([
      { freq: 523.25, start: 0, duration: 0.32 },
      { freq: 659.25, start: 0.1, duration: 0.32 },
      { freq: 783.99, start: 0.2, duration: 0.35 },
    ])
  }

  private playNotification() {
    this.playSequence([
      { freq: 880, start: 0, duration: 0.2, type: 'triangle', vol: 0.15 },
      { freq: 660, start: 0.15, duration: 0.2, type: 'triangle', vol: 0.15 },
    ])
  }

  private playGentle() {
    this.playSequence([{ freq: 440, duration: 0.5, vol: 0.1 }])
  }

  private playPop() {
    this.playSequence([{ freq: 720, duration: 0.12, type: 'triangle', vol: 0.22 }])
  }

  private playBubble() {
    if (!this.enabled || !this.audioContext) return
    const ctx = this.audioContext
    const now = ctx.currentTime
    try {
      const oscillator = ctx.createOscillator()
      const gainNode = ctx.createGain()
      oscillator.connect(gainNode)
      gainNode.connect(ctx.destination)
      oscillator.type = 'sine'
      oscillator.frequency.setValueAtTime(280, now)
      oscillator.frequency.exponentialRampToValueAtTime(720, now + 0.18)
      const vol = 0.16 * this.volume
      gainNode.gain.setValueAtTime(0, now)
      gainNode.gain.linearRampToValueAtTime(vol, now + 0.04)
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.28)
      oscillator.start(now)
      oscillator.stop(now + 0.28)
    } catch (error) {
      console.error('Error playing bubble:', error)
    }
  }

  private playMarimba() {
    this.playSequence([
      { freq: 392, start: 0, duration: 0.28, type: 'triangle', vol: 0.2 },
      { freq: 523.25, start: 0.12, duration: 0.32, type: 'triangle', vol: 0.18 },
    ])
  }

  private playPing() {
    this.playSequence([{ freq: 1320, duration: 0.45, type: 'sine', vol: 0.14 }])
  }

  private playMessage() {
    this.playSequence([
      { freq: 587.33, start: 0, duration: 0.16, type: 'sine', vol: 0.16 },
      { freq: 880, start: 0.12, duration: 0.22, type: 'sine', vol: 0.18 },
    ])
  }

  private playAlert() {
    this.playSequence([
      { freq: 980, start: 0, duration: 0.09, type: 'square', vol: 0.08 },
      { freq: 980, start: 0.14, duration: 0.09, type: 'square', vol: 0.08 },
      { freq: 980, start: 0.28, duration: 0.12, type: 'square', vol: 0.09 },
    ])
  }

  private playCrystal() {
    this.playSequence([
      { freq: 1046.5, start: 0, duration: 0.22, vol: 0.12 },
      { freq: 1318.5, start: 0.08, duration: 0.28, vol: 0.1 },
      { freq: 1568, start: 0.16, duration: 0.32, vol: 0.08 },
    ])
  }

  private playWood() {
    this.playSequence([
      { freq: 180, start: 0, duration: 0.08, type: 'triangle', vol: 0.22 },
      { freq: 220, start: 0.1, duration: 0.1, type: 'triangle', vol: 0.18 },
    ])
  }

  play(soundType?: SoundType) {
    void this.playAsync(soundType)
  }

  private async playAsync(soundType?: SoundType) {
    if (!this.enabled) return
    const ctx = this.getContext()
    if (!ctx) return

    if (ctx.state === 'suspended') {
      try {
        await ctx.resume()
      } catch {
        return
      }
    }
    if (ctx.state !== 'running') return

    const typeToPlay = soundType || this.currentSoundType
    switch (typeToPlay) {
      case 'chime':
        this.playChime()
        break
      case 'notification':
        this.playNotification()
        break
      case 'gentle':
        this.playGentle()
        break
      case 'pop':
        this.playPop()
        break
      case 'bubble':
        this.playBubble()
        break
      case 'marimba':
        this.playMarimba()
        break
      case 'ping':
        this.playPing()
        break
      case 'message':
        this.playMessage()
        break
      case 'alert':
        this.playAlert()
        break
      case 'crystal':
        this.playCrystal()
        break
      case 'wood':
        this.playWood()
        break
      case 'default':
      default:
        this.playTone(880, 0.2, 0.22)
        break
    }
  }

  playSuccess() {
    this.playTone(523.25, 0.15, 0.2) // C5
    setTimeout(() => this.playTone(659.25, 0.15, 0.2), 100) // E5
  }

  playError() {
    this.playTone(220, 0.3, 0.2) // A3
    setTimeout(() => this.playTone(196, 0.3, 0.2), 150) // G3
  }

  playClick() {
    this.playTone(1200, 0.05, 0.1) // High short click
  }
}

// Singleton instance
let soundManagerInstance: SoundManager | null = null

export function getSoundManager(): SoundManager {
  if (!soundManagerInstance) {
    soundManagerInstance = new SoundManager()
  }
  soundManagerInstance.ensureLoaded()
  return soundManagerInstance
}

/** Play the user's selected notification sound (or an explicit type). */
export function playSound(soundType?: SoundType) {
  const manager = getSoundManager()
  manager.play(soundType)
}

export function playNotificationAlert() {
  const manager = getSoundManager()
  if (!manager.isEnabled()) return
  manager.unlock()
  manager.play()
}

let soundUnlockInstalled = false

export function installSoundUnlock() {
  if (typeof window === 'undefined' || soundUnlockInstalled) return
  soundUnlockInstalled = true
  const unlock = () => getSoundManager().unlock()
  window.addEventListener('pointerdown', unlock)
  window.addEventListener('keydown', unlock)
  window.addEventListener('touchstart', unlock)
}

export function playSuccessSound() {
  const manager = getSoundManager()
  manager.playSuccess()
}

export function playErrorSound() {
  const manager = getSoundManager()
  manager.playError()
}

export function playClickSound() {
  const manager = getSoundManager()
  manager.playClick()
}

export function setSoundVolume(volume: number) {
  const manager = getSoundManager()
  manager.setVolume(volume)
}

export function getSoundVolume(): number {
  const manager = getSoundManager()
  return manager.getVolume()
}