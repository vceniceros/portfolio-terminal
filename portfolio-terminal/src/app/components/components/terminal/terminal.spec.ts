import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { PortfolioService } from '../../../services/portfolio.service';

import { Terminal } from './terminal';

describe('Terminal', () => {
  let component: Terminal;
  let fixture: ComponentFixture<Terminal>;

  beforeEach(async () => {
    const portfolioServiceMock: Partial<PortfolioService> = {
      getPortfolio: () =>
        of({
          aboutMe: { photo: '/img/monitorborder-off.png', description: 'test' },
          studies: [],
          projects: [],
          languages: [],
          contact: { email: '', linkedin: '', github: '', phone: '' },
          cvUrl: '',
        }),
      sendMessage: () => of({ ok: true }),
    };

    await TestBed.configureTestingModule({
      imports: [Terminal],
      providers: [{ provide: PortfolioService, useValue: portfolioServiceMock }],
    })
    .compileComponents();

    fixture = TestBed.createComponent(Terminal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
