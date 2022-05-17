import { Component, OnInit, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { HtmlColor } from 'src/app/domain/definitions/key-types';
import { BaseUiComponent } from 'src/app/ui/base/base-ui-component';
import { OrganizationTagDialogData } from '../services/organization-tag-dialog.service';

@Component({
    selector: 'os-organization-tag-dialog',
    templateUrl: './organization-tag-dialog.component.html',
    styleUrls: ['./organization-tag-dialog.component.scss']
})
export class OrganizationTagDialogComponent extends BaseUiComponent implements OnInit {
    public get isCreateView(): boolean {
        return this._isCreateView;
    }

    public get currentColor(): string {
        return this._lastValidColor;
    }

    public organizationTagForm!: FormGroup;

    private get colorForm(): AbstractControl | null {
        return this.organizationTagForm.get(`color`);
    }

    private _isCreateView = false;
    private _lastValidColor: string = ``;

    public constructor(
        @Inject(MAT_DIALOG_DATA) public data: OrganizationTagDialogData,
        private dialogRef: MatDialogRef<OrganizationTagDialogComponent>,
        private fb: FormBuilder
    ) {
        super();
    }

    public ngOnInit(): void {
        this.createForm();
        if (!this.data.organizationTag) {
            this._isCreateView = true;
        } else {
            this.updateForm();
        }
    }

    public onSaveClicked(): void {
        const { name, color }: { name: string; color: string } = this.organizationTagForm!.value;
        this.dialogRef.close({ name, color: color.startsWith(`#`) ? color : `#${color}` });
    }

    public generateColor(): void {
        this.organizationTagForm!.patchValue({ color: this.getRandomColor() });
    }

    public hasColorFormError(error: string): boolean {
        if (this.colorForm) {
            return this.colorForm.errors?.[error];
        }
        return false;
    }

    private getRandomColor(): string {
        return this.getColor(this.data.getRandomColor());
    }

    private createForm(): void {
        this._lastValidColor = this.getColor(this.data.defaultColor);
        this.organizationTagForm = this.fb.group({
            name: [``, Validators.required],
            color: [this._lastValidColor, Validators.pattern(/^[0-9a-fA-F]{6}$/)]
        });
        this.subscriptions.push(
            this.organizationTagForm.get(`color`)!.valueChanges.subscribe((currentColor: string) => {
                if (currentColor.length === 6) {
                    this._lastValidColor = currentColor;
                }
            })
        );
    }

    private updateForm(): void {
        const color = this.data.organizationTag!.color;
        const update = {
            name: this.data.organizationTag!.name,
            color: this.getColor(color)
        };
        this.organizationTagForm!.patchValue(update);
    }

    private getColor(htmlCode: HtmlColor): string {
        return htmlCode.startsWith(`#`) ? htmlCode.slice(1) : htmlCode;
    }
}