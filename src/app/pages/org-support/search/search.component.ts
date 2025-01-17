import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { ActivatedRoute, Router } from '@angular/router';

import { BaseComponent } from 'src/app/components/base/base.component';
import { slideAnimation } from 'src/app/animations/slide.animation';
import { UIState } from 'src/app/store/ui.states';
import { OrganisationService } from 'src/app/services/postgres/organisation.service';
import { Observable } from 'rxjs';
import { map, share } from 'rxjs/operators';
import { WrapperOrganisationService } from 'src/app/services/wrapper/wrapper-org-service';
import { TokenService } from 'src/app/services/auth/token.service';
import { ViewportScroller } from '@angular/common';
import { ScrollHelper } from 'src/app/services/helper/scroll-helper.services';
import { OrganisationUserDto } from 'src/app/models/user';

@Component({
  selector: 'app-org-support-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss'],
  animations: [
    slideAnimation({
      close: { 'transform': 'translateX(12.5rem)' },
      open: { left: '-12.5rem' }
    })
  ],
  encapsulation: ViewEncapsulation.None
})
export class OrgSupportSearchComponent extends BaseComponent implements OnInit {

  formGroup: FormGroup;
  public selectedRow!: string;
  public selectedRowId: string = '';
  public data: OrganisationUserDto[] = [];
  public pageOfItems!: any;
  public organisationId!: number;

  constructor(private cf: ChangeDetectorRef, private formBuilder: FormBuilder, private translateService: TranslateService, private organisationService: OrganisationService, private wrapperOrganisationService: WrapperOrganisationService, private readonly tokenService: TokenService, private router: Router, private route: ActivatedRoute, protected uiStore: Store<UIState>, protected viewportScroller: ViewportScroller, protected scrollHelper: ScrollHelper) {
    super(uiStore, viewportScroller, scrollHelper);
    this.formGroup = this.formBuilder.group({
      search: [, Validators.compose([Validators.required])],
    });
  }

  async ngOnInit() {
    // TODO This api call required a refactoring since its suppose to give a lot of data records (entire users in the system)
    // Suggestions:-
    // 1. Server side pagination
    // 2. Filter out the logged in organisation from backend (check whether core api authentication working correctly)
    let org = await this.organisationService.getById(this.tokenService.getCiiOrgId()).toPromise();
    if (org) {
      this.organisationId = org.organisationId;
      this.data = await this.organisationService.getUsers('').toPromise();
      this.data = this.data.filter((r: any) => r.organisationId != this.organisationId);
    }
  }

  async onSearch() {
    let orgName = this.formGroup.get('search')?.value;
    let results = await this.organisationService.getUsers(orgName).toPromise();
    this.data = results.filter((r: any) => r.organisationId != this.organisationId);
  }

  public onSelect(item: any) {
    this.selectedRow = item;
    this.selectedRowId = item.userName;
  }

  public onContinueClick() {
    this.router.navigateByUrl(`org-support/details/${this.selectedRowId}`);
  }

  public onCancelClick() {
    this.router.navigateByUrl('home');
  }

  onChangePage(pageOfItems: Array<any>) {
    this.pageOfItems = pageOfItems;
  }

}
