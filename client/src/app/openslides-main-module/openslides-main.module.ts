import { APP_INITIALIZER, NgModule } from '@angular/core';

import { OpenSlidesMainRoutingModule } from './openslides-main-routing.module';
import { OpenSlidesMainComponent } from './components/openslides-main/openslides-main.component';
import { OpenSlidesOverlayContainerComponent } from './components/openslides-overlay-container/openslides-overlay-container.component';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';
import { SlidesModule } from '../site/pages/meetings/modules/projector/modules/slides/slides.module';
import { OpenSlidesTranslationModule } from 'src/app/site/modules/translations';
import { AppLoadService } from './services/app-load.service';
import { httpInterceptorProviders } from './interceptors';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { OpenSlidesOverlayModule } from 'src/app/ui/modules/openslides-overlay/openslides-overlay.module';

/**
 * Returns a function that returns a promis that will be resolved, if all apps are loaded.
 * @param appLoadService The service that loads the apps.
 */
export function AppLoaderFactory(appLoadService: AppLoadService): () => Promise<void> {
    return () => appLoadService.loadApps();
}

const NOT_LAZY_LOADED_MODULES = [MatSnackBarModule, OpenSlidesOverlayModule];

@NgModule({
    declarations: [OpenSlidesMainComponent, OpenSlidesOverlayContainerComponent],
    imports: [
        BrowserModule,
        OpenSlidesMainRoutingModule,
        BrowserAnimationsModule,
        HttpClientModule,
        SlidesModule, // TODO: We should remove this!
        OpenSlidesTranslationModule.forRoot(),
        ...NOT_LAZY_LOADED_MODULES
    ],
    providers: [
        { provide: APP_INITIALIZER, useFactory: AppLoaderFactory, deps: [AppLoadService], multi: true },
        httpInterceptorProviders
    ],
    bootstrap: [OpenSlidesMainComponent]
})
export class OpenSlidesMainModule {}