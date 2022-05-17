import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MessageDialogData } from '../../definitions';
import { BaseComponent } from 'src/app/site/base/base.component';
import { ComponentServiceCollectorService } from 'src/app/site/services/component-service-collector.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
    selector: 'os-projector-message-dialog',
    templateUrl: './projector-message-dialog.component.html',
    styleUrls: ['./projector-message-dialog.component.scss']
})
export class ProjectorMessageDialogComponent extends BaseComponent implements OnInit {
    /**
     * The form data
     */
    public messageForm!: FormGroup;

    public constructor(
        componentServiceCollector: ComponentServiceCollectorService,
        protected override translate: TranslateService,
        private formBuilder: FormBuilder,
        @Inject(MAT_DIALOG_DATA) public data: MessageDialogData
    ) {
        super(componentServiceCollector, translate);
    }

    /**
     * Init create the form
     */
    public ngOnInit(): void {
        this.messageForm = this.formBuilder.group({
            message: [this.data.message, Validators.required]
        });
    }
}