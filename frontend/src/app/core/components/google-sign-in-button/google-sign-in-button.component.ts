import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { GoogleButtonText, GoogleIdentityService } from '../../services/google-identity.service';

@Component({
  selector: 'app-google-sign-in-button',
  templateUrl: './google-sign-in-button.component.html',
  styleUrl: './google-sign-in-button.component.scss',
})
export class GoogleSignInButtonComponent implements AfterViewInit {
  private readonly googleIdentityService = inject(GoogleIdentityService);

  @Input() text: GoogleButtonText = 'continue_with';
  @Input() unavailableMessage = 'Connexion Google indisponible pour le moment.';
  @Output() credentialReceived = new EventEmitter<string>();
  @ViewChild('buttonHost', { static: true }) protected buttonHost?: ElementRef<HTMLDivElement>;

  protected readonly errorMessage = signal<string | null>(null);

  async ngAfterViewInit() {
    const host = this.buttonHost?.nativeElement;

    if (!host) {
      return;
    }

    try {
      const buttonRendered = await this.googleIdentityService.renderButton(
        host,
        this.text,
        (credential) => {
          this.errorMessage.set(null);
          this.credentialReceived.emit(credential);
        },
      );

      if (!buttonRendered) {
        this.errorMessage.set(this.unavailableMessage);
      }
    } catch {
      this.errorMessage.set(this.unavailableMessage);
    }
  }
}
