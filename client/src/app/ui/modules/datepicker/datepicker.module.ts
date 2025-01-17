import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { OpenSlidesTranslationModule } from 'src/app/site/modules/translations';

import { DatepickerComponent } from './components/datepicker/datepicker.component';

@NgModule({
    declarations: [DatepickerComponent],
    imports: [
        CommonModule,
        MatDatepickerModule,
        ReactiveFormsModule,
        MatInputModule,
        MatFormFieldModule,
        MatButtonModule,
        MatIconModule,
        OpenSlidesTranslationModule.forChild()
    ],
    exports: [DatepickerComponent]
})
export class DatepickerModule {}
