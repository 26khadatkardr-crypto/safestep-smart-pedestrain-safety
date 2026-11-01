/**
 * SafeStep — Audio & Haptic Feedback Service
 *
 * Implements Web Audio API tone synthesis, Web Speech API spoken instructions,
 * and navigator.vibrate haptic pulses.
 */

import { RiskLevel } from '../types';

class SoundService {
  private audioCtx: AudioContext | null = null;
  private isMuted: boolean = false;
  private voiceEnabled: boolean = true;
  private lastSpokenTime: number = 0;
  private lastAlertLevel: RiskLevel | null = null;

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  public setVoiceEnabled(enabled: boolean) {
    this.voiceEnabled = enabled;
  }

  /**
   * Plays synthesized multi-frequency alert tone based on risk priority.
   */
  public playAlertTone(level: RiskLevel) {
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      if (level === 'red') {
        // High urgency warble alert (880Hz down to 660Hz rapid pulses)
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.setValueAtTime(700, now + 0.1);
        osc.frequency.setValueAtTime(880, now + 0.2);
        osc.frequency.setValueAtTime(700, now + 0.3);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);

        osc.start(now);
        osc.stop(now + 0.45);
      } else if (level === 'yellow') {
        // Caution double tone (540Hz -> 440Hz)
        osc.type = 'sine';
        osc.frequency.setValueAtTime(540, now);
        osc.frequency.setValueAtTime(440, now + 0.12);

        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

        osc.start(now);
        osc.stop(now + 0.35);
      } else if (level === 'green') {
        // Soft single chime (520Hz)
        osc.type = 'sine';
        osc.frequency.setValueAtTime(520, now);

        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

        osc.start(now);
        osc.stop(now + 0.25);
      }
    } catch {
      // Audio playback fails gracefully if user hasn't interacted with page yet
    }
  }

  /**
   * Triggers haptic pulse on supported mobile devices.
   */
  public triggerVibration(level: RiskLevel) {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        if (level === 'red') {
          navigator.vibrate([250, 100, 250, 100, 300]);
        } else if (level === 'yellow') {
          navigator.vibrate([150, 80, 150]);
        } else if (level === 'green') {
          navigator.vibrate([60]);
        }
      } catch {
        // Ignore if vibration is restricted by device permissions
      }
    }
  }

  /**
   * Speaks vocal instruction for pedestrians or drivers.
   * Throttled to avoid repetitive verbal bombardment.
   */
  public speakGuidance(text: string, level: RiskLevel, force: boolean = false) {
    if (!this.voiceEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }

    const now = Date.now();
    // Do not repeat the same phrase within 6 seconds unless level changed to red
    if (!force && this.lastAlertLevel === level && now - this.lastSpokenTime < 6000) {
      return;
    }

    this.lastSpokenTime = now;
    this.lastAlertLevel = level;

    try {
      window.speechSynthesis.cancel(); // Stop prior speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = level === 'red' ? 1.15 : 1.0;
      utterance.pitch = level === 'red' ? 1.1 : 1.0;
      utterance.volume = 0.85;

      window.speechSynthesis.speak(utterance);
    } catch {
      // Speech failed gracefully
    }
  }

  /**
   * Speaks dedicated 50-meter proximity warning.
   */
  public speakProximityUnder50m(distanceMeters: number, mode: 'driver' | 'pedestrian' | string = 'driver') {
    const roundedDist = Math.max(1, Math.round(distanceMeters));
    let text = `Warning! Pedestrian within ${roundedDist} meters. Slow down immediately.`;
    if (mode === 'pedestrian') {
      text = `Warning! Approaching vehicle within ${roundedDist} meters. Watch crossing.`;
    }
    this.speakGuidance(text, 'yellow', true);
  }

  /**
   * Speaks collision detected announcement.
   */
  public speakCollisionAlert() {
    this.playAlertTone('red');
    this.speakGuidance('Emergency collision alert! Impact detected on roadway. Pedestrian and vehicle halted.', 'red', true);
  }

  /**
   * Speaks brake assist full stop confirmation.
   */
  public speakBrakeAssistStopped() {
    this.playAlertTone('green');
    this.speakGuidance('Brake assist applied. Vehicle has come to a complete stop.', 'green', true);
  }

  /**
   * Speaks crossing request announcement for drivers and pedestrians.
   */
  public speakCrossingRequested(locationName?: string | null) {
    this.playAlertTone('yellow');
    const locationPart = locationName ? ` near ${locationName}` : '';
    this.speakGuidance(`Pedestrian crossing request submitted${locationPart}. Approaching driver notified.`, 'yellow', true);
  }

  public speakCrossingVehicleSlowing() {
    this.speakGuidance('Simulated vehicle is decelerating to yield for crossing.', 'yellow', true);
  }

  public speakCrossingVehicleStopped() {
    this.playAlertTone('green');
    this.speakGuidance('Simulated vehicle has stopped. Check the roadway carefully before crossing.', 'green', true);
  }

  public speakCrossingCompleted() {
    this.playAlertTone('green');
    this.speakGuidance('Pedestrian crossing marked as completed. Safe clearance restored.', 'green', true);
  }
}

export const soundService = new SoundService();
