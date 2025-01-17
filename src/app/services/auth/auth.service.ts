import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { catchError, map } from 'rxjs/operators';
import { throwError } from 'rxjs/internal/observable/throwError';
import 'rxjs/add/observable/of';
import { Observable, Subject } from 'rxjs';
import * as CryptoJS from 'crypto-js';
import { environment } from '../../../environments/environment';
import { PasswordChangeDetail } from 'src/app/models/passwordChangeDetail';
import { TokenInfo } from 'src/app/models/auth';
import { TokenService } from './token.service';
import { ServicePermission } from 'src/app/models/servicePermission';
import { CcsServiceInfo } from 'src/app/models/configurations';
import { WorkerService } from '../worker.service';
import { Router } from '@angular/router';
import { Location } from '@angular/common';

@Injectable()
export class AuthService {

  public url: string = environment.uri.api.security;
  public authTokenRenewaltimerReference: any = undefined;
  servicePermission: ServicePermission[];
  ccsServices: CcsServiceInfo[] = [];

  constructor(private readonly workerService: WorkerService, private router: Router, private location: Location,
    private readonly httpService: HttpClient, private readonly tokenService: TokenService) {
    this.servicePermission = [];
  }

  login(username: string, password: string): Observable<any> {
    const options = {
      headers: new HttpHeaders().append('Content-Type', 'application/json')
    }
    //ccs-sso-reliable-toucan-ab.london.cloudapps.digital
    const body = { userName: username, userPassword: password }
    return this.httpService.post(`${this.url}/security/login`, body, options).pipe(
      map(data => {
        return data;
      }),
      catchError(error => {
        return throwError(error);
      })
    );
  }

  public isUserAuthenticated() {
    const tokens = localStorage.getItem('user_name');
    return tokens != null;
  }

  public async isInMemoryTokenExists(): Promise<boolean> {
    let at = await this.workerService.checkAccessToken();
    return at;
  }

  public getCcsServices() {
    if (this.ccsServices.length == 0) {
      return this.httpService.get(`${environment.uri.api.isApiGateWayEnabled ? 
        environment.uri.api.wrapper.apiGatewayEnabled.configuration : environment.uri.api.wrapper.apiGatewayDisabled.configuration}/GetCcsServices`).pipe(
        map(data => {
          return data;
        }));
    }
    return Observable.of(this.ccsServices);
  }

  public registerTokenRenewal() {
    if (this.authTokenRenewaltimerReference == undefined) {
      let thisVar = this;
      this.authTokenRenewaltimerReference = setInterval(function () {
        let exp = thisVar.tokenService.getAccessTokenExpiration();
        if (exp != null) {
          let expireDate = new Date(exp * 1000);
          var date = new Date();
          let diffInMinutes = Math.floor((expireDate.getTime() - date.getTime()) / 60000);

          // If token expiration is less than 10 minutes, trigger token renewal 
          if (diffInMinutes <= 10) {
            thisVar.renewAccessToken();
          }
        }
        else {
          thisVar.renewAccessToken();
        }
      }, 300000); // execute every 5 minutes (60000*5)
    }
  }

  renewAccessToken(url: string = '') {
    this.getRefreshToken().toPromise().then((refreshToken: any) => {
      return this.renewToken(refreshToken || '').toPromise().then((tokenInfo: TokenInfo) => {
        return this.saveRefreshToken(tokenInfo.refresh_token).toPromise().then(() => {
          this.workerService.storeTokenInWorker(tokenInfo);
          let decodedAccessToken = this.tokenService.getDecodedToken(tokenInfo.access_token);
          localStorage.setItem('at_exp', decodedAccessToken.exp);
          if (url.length > 0) {
            this.router.navigateByUrl(url, { replaceUrl: true });
          }
        });
      },
        (err) => {
          // This could due to invalid refresh token (refresh token rotation)  
          if (err.error == "INVALID_CREDENTIALS") {
            // sign out the user
            this.logOutAndRedirect();
          }
        });
    });
  }

  private authSuccessSource = new Subject<boolean>();

  // Observable string streams
  userAutnenticated$ = this.authSuccessSource.asObservable();

  publishAuthStatus(authSuccess: boolean) {
    this.authSuccessSource.next(authSuccess);
  }

  public isAuthenticated(): Observable<boolean> {
    const tokens = localStorage.getItem('user_name');
    if (tokens) {
      return Observable.of(true);
    }
    return Observable.of(false);
  }

  register(firstName: string, lastName: string, username: string, email: string): Observable<any> {
    const options = {
      headers: new HttpHeaders().append('Content-Type', 'application/json')
        .append("X-API-Key", environment.securityApiKey)
    }
    const body = { FirstName: firstName, LastName: lastName, UserName: username, Email: email, Role: 'Admin', Groups: [] }
    return this.httpService.post(`${this.url}/security/register`, body, options).pipe(
      map(data => {
        return data;
      }),
      catchError(error => {
        return throwError(error);
      })
    );
  }

  changePassword(passwordChangeDetail: PasswordChangeDetail): Observable<any> {
    return this.httpService.post(`${environment.uri.api.postgres}/auth/change_password`, passwordChangeDetail).pipe(
      map(data => {
        return data;
      }),
      catchError(error => {
        return throwError(error);
      })
    );
  }

  resetPassword(userName: string): Observable<any> {
    return this.httpService.post(`${this.url}/security/passwordresetrequest`, "\"" + userName + "\"");
  }

  token(code: string): Observable<any> {
    const options = {
      headers: new HttpHeaders().append('Content-Type', 'application/x-www-form-urlencoded')
    }
    let body = `client_id=${environment.idam_client_id}&code=${code}&grant_type=authorization_code&code_verifier=${this.getCodeVerifier()}&redirect_uri=${environment.uri.web.dashboard + '/authsuccess'}`;

    return this.httpService.post(`${this.url}/security/token`, body, options).pipe(
      map(data => {
        return data;
      }),
      catchError(error => {
        return throwError(error);
      })
    );
  }

  renewToken(refreshToken: string): Observable<TokenInfo> {
    const options = {
      headers: new HttpHeaders().append('Content-Type', 'application/x-www-form-urlencoded')
    }

    let body = `client_id=${environment.idam_client_id}&refresh_token=${refreshToken}&grant_type=refresh_token&redirect_uri=${environment.uri.web.dashboard + '/authsuccess'}`;

    return this.httpService.post<TokenInfo>(`${this.url}/security/token`, body, options);
  }


  saveRefreshToken(refreshToken: string) {
    let coreDataUrl: string = `${environment.uri.api.postgres}/auth/save_refresh_token`;
    const body = {
      'refreshToken': refreshToken
    }
    return this.httpService.post(coreDataUrl, body).pipe(
      map(data => {
        return data;
      }),
      catchError(error => {
        return throwError(error);
      })
    );
  }

  getRefreshToken() {
    const options = {
      headers: new HttpHeaders().append('responseType', 'text')
    }
    let coreDataUrl: string = `${environment.uri.api.postgres}/auth/get_refresh_token`;
    return this.httpService.get(coreDataUrl, { responseType: 'text' });
  }

  getSignOutEndpoint() {
    return environment.uri.api.security + '/security/logout?clientId=' + environment.idam_client_id
      + '&redirecturi=' + environment.uri.web.dashboard;
  }

  getAuthorizedEndpoint() {
    let codeVerifier = this.getCodeVerifier();
    const codeVerifierHash = CryptoJS.SHA256(codeVerifier).toString(CryptoJS.enc.Base64);
    const codeChallenge = codeVerifierHash
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
    let url = environment.uri.api.security + '/security/authorize?scope=email profile openid offline_access&response_type=code&client_id='
      + environment.idam_client_id
      + '&code_challenge_method=S256' + '&code_challenge=' + codeChallenge
      + '&redirect_uri=' + environment.uri.web.dashboard + '/authsuccess'

    return url;
  }

  getCodeVerifier() {
    let codeVerifier = localStorage.getItem('codeVerifier');
    if (codeVerifier == undefined || codeVerifier == '') {
      codeVerifier = this.generateRandom(128);
      localStorage.setItem('codeVerifier', codeVerifier);
    }
    return codeVerifier;
  }

  generateRandom(length: number) {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  }


  public signOut() {
    clearTimeout(this.authTokenRenewaltimerReference);
    localStorage.removeItem('brickedon_user');
    localStorage.removeItem('user_name');
    localStorage.removeItem('ccs_organisation_id');
    localStorage.removeItem('cii_organisation');
    localStorage.removeItem('brickendon_org_reg_email_address');
    localStorage.removeItem('codeVerifier');
    localStorage.removeItem('securityapiurl');
    localStorage.removeItem('redirect_uri');
    localStorage.removeItem('client_id');
    localStorage.removeItem('currentGlobalRoute');
    localStorage.removeItem('cii_organisation_id');
    localStorage.removeItem('at_exp');
  }

  public logOutAndRedirect() {
    this.clearRefreshToken().toPromise().then(() => {
      this.signOut();
      window.location.href = this.getSignOutEndpoint();
    }),
      catchError(error => {
        return throwError(error);
      });
  }

  clearRefreshToken() {
    let coreDataUrl: string = `${environment.uri.api.postgres}/auth/sign_out`;
    return this.httpService.post(coreDataUrl, null);
  }

  public setWindowLocationHref(href: string) {
    window.location.href = href;
  }

  getPermissions(): Observable<any> {
    if (this.servicePermission.length == 0) {
      return this.httpService.get<ServicePermission[]>(`${environment.uri.api.postgres}/user/GetPermissions?userName=`
        + localStorage.getItem('user_name') + `&serviceClientId=` + environment.idam_client_id).pipe(
          map((data: ServicePermission[]) => {
            // Cache permissions locally
            this.servicePermission = data;
            return data;
          }),
          catchError(error => {
            return throwError(error);
          })
        );
    }
    else {
      return Observable.of(this.servicePermission);
    }
  }

  hasPermission(permissionName: string) {
    return this.getPermissions().pipe(
      map((rolePermissions: ServicePermission[]) => {
        // Get the all the roles available for the permission
        var rolesWithThePermission = rolePermissions.filter(rp => rp.permissionName == permissionName);
        return rolesWithThePermission.length != 0;
      }),
      catchError(error => {
        return throwError(error);
      })
    );
  }

  nominate(firstName: string, lastName: string, email: string): Observable<any> {
    const options = {
      headers: new HttpHeaders().append('Content-Type', 'application/json')
    }
    const body = { FirstName: firstName, LastName: lastName, UserName: email, Email: email, Role: 'Admin', Groups: [] }
    return this.httpService.post(`${this.url}/security/nominate`, body, options).pipe(
      map(data => {
        return data;
      }),
      catchError(error => {
        return throwError(error);
      })
    );
  }
}
