import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  ContactMessagePayload,
  ContactMessageResponse,
  PortfolioData,
} from '../models/portfolio.model';

@Injectable({
  providedIn: 'root',
})
export class PortfolioService {
  private readonly http = inject(HttpClient);

  getPortfolio(): Observable<PortfolioData> {
    return this.http.get<PortfolioData>('/api/portfolio');
  }

  sendMessage(payload: ContactMessagePayload): Observable<ContactMessageResponse> {
    return this.http.post<ContactMessageResponse>('/api/contact', payload);
  }
}
