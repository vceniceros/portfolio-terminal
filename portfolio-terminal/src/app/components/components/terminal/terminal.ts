import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  afterNextRender,
  Component,
  HostListener,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  WritableSignal,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription, interval } from 'rxjs';
import {
  ContactMessagePayload,
  LanguageSkill,
  PortfolioData,
  Study,
} from '../../../models/portfolio.model';
import { PortfolioService } from '../../../services/portfolio.service';

type TerminalScreen =
  | 'off'
  | 'booting'
  | 'vault-logo'
  | 'main-menu'
  | 'about'
  | 'studies'
  | 'projects'
  | 'languages'
  | 'contact-options'
  | 'contact-message'
  | 'downloading';

type ContactField = 'name' | 'email' | 'phone' | 'message';

interface ContactDraft extends ContactMessagePayload {}

@Component({
  selector: 'app-terminal',
  imports: [CommonModule, FormsModule],
  templateUrl: './terminal.html',
  styleUrl: './terminal.css',
})
export class Terminal implements OnInit, OnDestroy {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly portfolioService = inject(PortfolioService);
  private readonly subscriptions = new Subscription();

  readonly isBrowser = isPlatformBrowser(this.platformId);
  readonly screen = signal<TerminalScreen>('off');
  readonly poweredOn = signal(false);
  readonly portfolio = signal<PortfolioData | null>(null);
  readonly loadError = signal<string>('');

  readonly bootText = signal('');
  readonly aboutText = signal('');
  readonly downloadText = signal('');

  readonly contactMode = signal<'menu' | 'methods'>('menu');
  readonly contactStep = signal(0);
  readonly contactInput = signal('');
  readonly contactStatus = signal<'idle' | 'sending' | 'sent' | 'error'>('idle');
  readonly contactFeedback = signal('');

  readonly contactOrder: ContactField[] = ['name', 'email', 'phone', 'message'];

  private readonly contactDraft: ContactDraft = {
    name: '',
    email: '',
    phone: '',
    message: '',
  };

  private timeouts: ReturnType<typeof setTimeout>[] = [];

  readonly currentPrompt = computed(() => {
    const prompts: Record<ContactField, string> = {
      name: 'ENTER YOUR NAME',
      email: 'ENTER YOUR EMAIL',
      phone: 'ENTER YOUR PHONE',
      message: 'ENTER YOUR MESSAGE',
    };
    const field = this.contactOrder[this.contactStep()];
    return prompts[field] ?? '';
  });

  readonly menuOptions = [
    { label: 'ABOUT ME', target: 'about' as TerminalScreen },
    { label: 'STUDIES', target: 'studies' as TerminalScreen },
    { label: 'PROJECTS', target: 'projects' as TerminalScreen },
    { label: 'LANGUAGES', target: 'languages' as TerminalScreen },
    { label: 'CONTACT ME', target: 'contact-options' as TerminalScreen },
    { label: 'DOWNLOAD CV', target: 'downloading' as TerminalScreen },
  ];

  ngOnInit(): void {
    if (!this.isBrowser) {
      return;
    }

    afterNextRender(() => {
      this.updateScale();
    });

    const sub = this.portfolioService.getPortfolio().subscribe({
      next: (data) => {
        this.portfolio.set(data);
      },
      error: () => {
        this.loadError.set('PORTFOLIO DATA UNAVAILABLE');
      },
    });
    this.subscriptions.add(sub);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.clearScheduledTasks();
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.updateScale();
  }

  togglePower(): void {
    if (this.poweredOn()) {
      this.powerDown();
      return;
    }

    this.poweredOn.set(true);
    this.playAudio('poweron');
    this.startBootSequence();
  }

  navigateTo(target: TerminalScreen): void {
    if (!this.poweredOn()) {
      return;
    }

    this.playAudio('kenter');
    if (target === 'downloading') {
      this.beginDownload();
      return;
    }

    this.screen.set(target);
    if (target === 'about') {
      this.startAboutTypewriter();
    }
    if (target === 'contact-options') {
      this.contactMode.set('menu');
    }
    if (target === 'contact-message') {
      this.startContactFlow();
    }
  }

  playKeystroke(): void {
    if (!this.poweredOn()) {
      return;
    }
    const index = Math.floor(Math.random() * 10) + 1;
    this.playAudio(`k${index}`);
  }

  openContactMethods(): void {
    this.playAudio('kenter');
    this.contactMode.set('methods');
  }

  goBack(): void {
    if (this.screen() === 'contact-options' && this.contactMode() === 'methods') {
      this.playAudio('kenter');
      this.contactMode.set('menu');
      return;
    }

    if (this.screen() === 'contact-message') {
      this.playAudio('kenter');
      this.screen.set('contact-options');
      this.contactMode.set('menu');
      return;
    }

    this.navigateTo('main-menu');
  }

  submitContactInput(event: KeyboardEvent): void {
    if (event.key !== 'Enter' || this.contactStatus() === 'sending') {
      return;
    }

    const value = this.contactInput().trim();
    if (!value) {
      return;
    }

    this.playAudio('kenter');
    const currentField = this.contactOrder[this.contactStep()];
    this.contactDraft[currentField] = value;
    this.contactInput.set('');

    const nextStep = this.contactStep() + 1;
    if (nextStep < this.contactOrder.length) {
      this.contactStep.set(nextStep);
      return;
    }

    this.contactStatus.set('sending');
    this.contactFeedback.set('TRANSMITTING MESSAGE...');

    const sub = this.portfolioService.sendMessage(this.contactDraft).subscribe({
      next: () => {
        this.contactStatus.set('sent');
        this.contactFeedback.set('MESSAGE SENT');
        this.playAudio('passgood');
        const timeoutId = setTimeout(() => {
          this.screen.set('main-menu');
          this.contactMode.set('menu');
        }, 2000);
        this.timeouts.push(timeoutId);
      },
      error: () => {
        this.contactStatus.set('error');
        this.contactFeedback.set('TRANSMISSION FAILED');
        this.playAudio('passbad');
      },
    });
    this.subscriptions.add(sub);
  }

  openLink(url: string): void {
    if (!this.isBrowser || !url) {
      return;
    }
    window.open(url, '_blank', 'noopener');
  }

  formatStudyPeriod(study: Study): string {
    return `[${study.startYear} - ${study.endYear ?? 'CURRENTLY'}]`;
  }

  trackByName(_index: number, item: { name: string }): string {
    return item.name;
  }

  trackByStudy(_index: number, item: Study): string {
    return `${item.title}-${item.startYear}`;
  }

  trackByLanguage(_index: number, item: LanguageSkill): string {
    return `${item.name}-${item.proficiency}`;
  }

  private powerDown(): void {
    this.clearScheduledTasks();
    this.playAudio('poweroff');
    this.poweredOn.set(false);
    this.screen.set('off');
    this.bootText.set('');
    this.aboutText.set('');
    this.downloadText.set('');
    this.contactInput.set('');
    this.contactFeedback.set('');
    this.contactStatus.set('idle');
  }

  private startBootSequence(): void {
    this.clearScheduledTasks();
    this.screen.set('booting');
    this.typewrite(
      'ROBCO INDUSTRIES (TM) TERMALINK PROTOCOL INITIALIZING...',
      25,
      this.bootText,
      () => {
        const firstDelay = setTimeout(() => {
          this.screen.set('vault-logo');
          this.typewrite('VAULT-TEC SYSTEM ONLINE', 30, this.bootText, () => {
            const secondDelay = setTimeout(() => {
              this.screen.set('main-menu');
            }, 400);
            this.timeouts.push(secondDelay);
          });
        }, 450);
        this.timeouts.push(firstDelay);
      },
    );
  }

  private startAboutTypewriter(): void {
    const text = this.portfolio()?.aboutMe.description ?? '';
    this.typewrite(text, 15, this.aboutText);
  }

  private startContactFlow(): void {
    this.contactStep.set(0);
    this.contactInput.set('');
    this.contactFeedback.set('');
    this.contactStatus.set('idle');
    this.contactDraft.name = '';
    this.contactDraft.email = '';
    this.contactDraft.phone = '';
    this.contactDraft.message = '';
  }

  private beginDownload(): void {
    this.screen.set('downloading');
    this.typewrite('ACCESSING FILE...', 35, this.downloadText, () => {
      const cvUrl = this.portfolio()?.cvUrl;
      if (cvUrl && this.isBrowser) {
        window.open(cvUrl, '_blank', 'noopener');
      }
      const timeoutId = setTimeout(() => {
        this.screen.set('main-menu');
      }, 1200);
      this.timeouts.push(timeoutId);
    });
  }

  private typewrite(
    text: string,
    speed: number,
    target: WritableSignal<string>,
    onDone?: () => void,
  ): void {
    const content = text ?? '';
    if (!content.length) {
      target.set('');
      onDone?.();
      return;
    }

    let index = 0;
    const sub = interval(speed).subscribe(() => {
      index += 1;
      const chunk = content.slice(0, index);
      target.set(index >= content.length ? chunk : `${chunk}█`);
      if (index >= content.length) {
        sub.unsubscribe();
        onDone?.();
      }
    });

    this.subscriptions.add(sub);
  }

  private playAudio(id: string): void {
    if (!this.isBrowser) {
      return;
    }

    const element = document.getElementById(id) as HTMLAudioElement | null;
    if (!element) {
      return;
    }

    element.currentTime = 0;
    void element.play().catch(() => {
      // Audio playback can be blocked by browser policies before interaction.
    });
  }

  private clearScheduledTasks(): void {
    this.timeouts.forEach((timeoutId) => clearTimeout(timeoutId));
    this.timeouts = [];
  }

  private updateScale(): void {
    if (!this.isBrowser) {
      return;
    }

    const scale = Math.min(1, window.innerWidth / 930);
    document.documentElement.style.setProperty('--terminal-scale', `${scale}`);
  }
}

