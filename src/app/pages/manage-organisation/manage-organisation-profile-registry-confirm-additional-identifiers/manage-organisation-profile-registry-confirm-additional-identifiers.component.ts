import { ChangeDetectionStrategy, Component, OnInit, ViewEncapsulation } from '@angular/core';
import { Store } from '@ngrx/store';
import { ActivatedRoute, Router } from '@angular/router';
import { from, Observable, throwError } from 'rxjs';
import { catchError, map, share, timeout } from 'rxjs/operators';

import { BaseComponent } from 'src/app/components/base/base.component';
import { slideAnimation } from 'src/app/animations/slide.animation';
import { Scheme } from '../../../models/scheme';
import { UIState } from 'src/app/store/ui.states';
import { ciiService } from 'src/app/services/cii/cii.service';
import { WrapperUserService } from 'src/app/services/wrapper/wrapper-user.service';
import { User } from 'src/app/models/user';
import { TokenService } from 'src/app/services/auth/token.service';
import { ViewportScroller } from '@angular/common';
import { ScrollHelper } from 'src/app/services/helper/scroll-helper.services';

@Component({
  selector: 'app-manage-organisation-profile-registry-confirm-additional-identifiers',
  templateUrl: './manage-organisation-profile-registry-confirm-additional-identifiers.component.html',
  styleUrls: ['./manage-organisation-profile-registry-confirm-additional-identifiers.component.scss'],
  animations: [
    slideAnimation({
      close: { 'transform': 'translateX(12.5rem)' },
      open: { left: '-12.5rem' }
    })
  ],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ManageOrganisationRegistryConfirmAdditionalDetailsComponent extends BaseComponent implements OnInit {

  public item$!: Observable<any>;
  public orgGroup: string = 'manage-org/register/user';
  public schemeName: string = '';
  public selectedIdentifiers: any[] = new Array();
  public routeParams!: any;
  public organisationId!: string;
  public user!: User;
  public orgId!: string;

  constructor(private ciiService: ciiService, private wrapperService: WrapperUserService, private router: Router, private route: ActivatedRoute, protected uiStore: Store<UIState>, private readonly tokenService: TokenService, protected viewportScroller: ViewportScroller, protected scrollHelper: ScrollHelper) {
    super(uiStore, viewportScroller, scrollHelper);
    this.organisationId = JSON.parse(localStorage.getItem('organisation_id') + '');
    this.orgId = JSON.parse(localStorage.getItem('organisation_id') + '');
  }

  ngOnInit() {
    this.schemeName = JSON.parse(localStorage.getItem('scheme_name') + '').replace('"', '').replace('"', '');
    this.route.params.subscribe(params => {
      this.routeParams = params;
      if (params.id && params.scheme) {

        const ciiOrgId = this.tokenService.getCiiOrgId();
        this.item$ = this.ciiService.getIdentifiers(ciiOrgId, params.scheme, params.id).pipe(share());
        this.item$.subscribe({
          next: result => {
            if (result.error) {
              if (result.message == 'Error 400') {
                this.router.navigateByUrl(`manage-org/register/error/notfound`);
              } else if (result.message == 'Error 401') {
                this.router.navigateByUrl(`manage-org/register/error/generic`);
              } else if (result.message == 'Error 403') {
                this.router.navigateByUrl(`manage-org/register/error/generic`);
              } else if (result.message == 'Error 404') {
                this.router.navigateByUrl(`manage-org/register/error/notfound`);
              } else if (result.message == 'Error 405') {
                this.router.navigateByUrl(`manage-org/register/error`);
              } else {
                this.router.navigateByUrl(`manage-org/register/error/generic`);
              }
            } else {
              // this.selectedIdentifiers = result.additionalIdentifiers;
              this.selectedIdentifiers = [...result.additionalIdentifiers];
              // Object.assign(result.additionalIdentifiers, this.selectedIdentifiers);
              localStorage.setItem('cii_organisation', JSON.stringify(result));
            }
          }, error: err => {
            if (err.status) {
              if (err.status == '400' || err.status == '404') {
                this.router.navigateByUrl(`manage-org/profile/${this.organisationId}/registry/error/notfound`, { replaceUrl: true });
              }
              else if (err.status == '405') {
                this.router.navigateByUrl(`manage-org/profile/${this.organisationId}/registry/error/`, { replaceUrl: true });
              } else {
                this.router.navigateByUrl(`manage-org/profile/${this.organisationId}/registry/error/generic`, { replaceUrl: true });
              }
            }
            // this.router.navigateByUrl(`manage-org/register/error/generic`);
          }
        });

        //   this.wrapperService.getUser(localStorage.getItem('user_name')+'').subscribe({
        //     next: (u: User) => {
        //         if (u != null) {
        //           this.user = u;
        //           this.item$ = this.ciiService.getIdentifiers(u.organisationId, params.scheme, params.id).pipe(share());
        //           this.item$.subscribe({
        //             next: result => {
        //               if (result.error) {
        //                 if (result.message == 'Error 400') {
        //                   this.router.navigateByUrl(`manage-org/register/error/notfound`);
        //                 } else if (result.message == 'Error 401') {
        //                   this.router.navigateByUrl(`manage-org/register/error/generic`);
        //                 } else if (result.message == 'Error 403') {
        //                   this.router.navigateByUrl(`manage-org/register/error/generic`);
        //                 } else if (result.message == 'Error 404') {
        //                   this.router.navigateByUrl(`manage-org/register/error/notfound`);
        //                 } else if (result.message == 'Error 405') {
        //                   this.router.navigateByUrl(`manage-org/register/error`);
        //                 } else {
        //                  this.router.navigateByUrl(`manage-org/register/error/generic`);
        //                 }
        //               } else {
        //                 this.selectedIdentifiers = result.additionalIdentifiers;
        //                 localStorage.setItem('cii_organisation', JSON.stringify(result));
        //               }
        //             }, error: err => {
        //               if (err.status) {
        //                 if (err.status == '400') {
        //                   this.router.navigateByUrl(`manage-org/register/error/notfound`);
        //                 } else if (err.status == '401') {
        //                   this.router.navigateByUrl(`manage-org/register/error/generic`);
        //                 } else if (err.status == '403') {
        //                   this.router.navigateByUrl(`manage-org/register/error/generic`);
        //                 } else if (err.status == '404') {
        //                   this.router.navigateByUrl(`manage-org/register/error/notfound`);
        //                 } else if (err.status == '405') {
        //                   this.router.navigateByUrl(`manage-org/register/error`);
        //                 }
        //               }
        //               this.router.navigateByUrl(`manage-org/register/error/generic`);
        //             }
        //           });              
        //         } else {
        //             console.log('no user found from wrapper service');
        //         }
        //     },
        //     error: (error: any) => {
        //         console.log(error);
        //     }
        //   });

      }
    });
  }

  public goBack() {
    this.router.navigateByUrl('manage-org/profile/' + this.organisationId + '/registry/search/' + this.routeParams.scheme + '/' + this.routeParams.id);
  }

  public onSubmit() {
    let organisation = JSON.parse(localStorage.getItem('cii_organisation') + '');
    organisation.additionalIdentifiers = this.selectedIdentifiers;
    localStorage.setItem('cii_organisation', JSON.stringify(organisation));
    const json = {
      ccsOrgId: this.tokenService.getCiiOrgId(),
      identifier: {
        scheme: this.routeParams.scheme,
        id: this.routeParams.id,
      }
    };
    this.ciiService.updateOrganisation(JSON.stringify(json)).subscribe((data) => {
      this.router.navigateByUrl('manage-org/profile/' + this.organisationId + '/registry/confirmation/' + this.routeParams.scheme + '/' + this.routeParams.id);
    },
      (error) => {
        console.log(error);
      });
  }

  public onChange(event: any, additionalIdentifier: any) {
    if (event.currentTarget.checked) {
      this.selectedIdentifiers.push(additionalIdentifier);
    } else {
      for (let i = 0; i < this.selectedIdentifiers.length; i++) {
        if (this.selectedIdentifiers[i].id === additionalIdentifier.id) {
          this.selectedIdentifiers.splice(i, 1);
        }
      }
    }
  }

  public getSchemaName(schema: string): string {
    switch (schema) {
      case 'GB-COH': {
        return 'Companies House';
      }
      case 'US-DUN': {
        return 'Dun & Bradstreet';
      }
      case 'GB-CHC': {
        return 'Charities Commission for England and Wales';
      }
      case 'GB-SC': {
        return 'Scottish Charities Commission';
      }
      case 'GB-NIC': {
        return 'Northern Ireland Charities Commission';
      }
      default: {
        return '';
      }
    }
  }

}
