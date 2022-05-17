import { Injectable } from '@angular/core';
import { User } from '../../domain/models/users/user';
import { BaseController } from '../base/base-controller';
import { ViewUser } from '../pages/meetings/view-models/view-user';
import { ControllerServiceCollectorService } from './controller-service-collector.service';
import { Observable } from 'rxjs';
import { Identifiable } from '../../domain/interfaces';
import { Action } from '../../gateways/actions';
import {
    UserRepositoryService,
    ShortNameInformation,
    UserPatchFn,
    FullNameInformation
} from 'src/app/gateways/repositories/users';
import { Id } from 'src/app/domain/definitions/key-types';
import { GetActiveUsersAmountPresenterService } from 'src/app/gateways/presenter';
import { OML } from 'src/app/domain/definitions/organization-permission';
import { OperatorService } from 'src/app/site/services/operator.service';

/**
 * type for determining the user name from a string during import.
 * See {@link parseUserString} for implementations
 */
type StringNamingSchema = 'lastCommaFirst' | 'firstSpaceLast';

@Injectable({
    providedIn: 'root'
})
export class UserControllerService extends BaseController<ViewUser, User> {
    public constructor(
        controllerServiceCollector: ControllerServiceCollectorService,
        protected override repo: UserRepositoryService,
        private presenter: GetActiveUsersAmountPresenterService,
        private operator: OperatorService
    ) {
        super(controllerServiceCollector, User, repo);
    }

    ///////////////////
    /////////////////// TODO: Remove, because participants and accounts have their dedicated "controller"

    public create(...payload: any[]): Promise<Identifiable[]> {
        return this.repo.create(...payload);
    }

    public update(patch: UserPatchFn, ...users: ViewUser[]): Action<void> {
        return this.repo.update(patch, ...users);
    }

    public updateSelf(patch: UserPatchFn, user: ViewUser): Promise<void> {
        return this.repo.updateSelf(patch, user);
    }

    public async delete(...userIds: Identifiable[]): Promise<void> {
        await this.repo.delete(...userIds).resolve();
    }

    public setPassword(user: Identifiable, password: string, setAsDefault?: boolean): Promise<void> {
        return this.repo.setPassword(user, password, setAsDefault);
    }

    public setPasswordSelf(user: Identifiable, oldPassword: string, newPassword: string): Promise<void> {
        return this.repo.setPasswordSelf(user, oldPassword, newPassword);
    }

    public resetPasswordToDefault(...users: Identifiable[]): Promise<void> {
        return this.repo.resetPasswordToDefault(users);
    }

    public getGeneralViewModelObservable(): Observable<ViewUser> {
        return this.repo.getGeneralViewModelObservable();
    }

    public getShortName(user: ShortNameInformation): string {
        return this.repo.getShortName(user);
    }

    public generateNewPasswords(users: Identifiable[]): Promise<void> {
        return this.repo.bulkGenerateNewPasswords(users);
    }

    /////////////////////////////
    /////////////////////////////
    /////////////////////////////

    public forgetPassword(email: string): Promise<void> {
        return this.repo.forgetPassword(email);
    }

    public forgetPasswordConfirm(payload: {
        user_id: Id;
        authorization_token: string;
        new_password: string;
    }): Promise<void> {
        return this.repo.forgetPasswordConfirm(payload);
    }

    /**
     * Generates a random password
     *
     * @param length The length of the password to generate
     * @returns a random password
     */
    public getRandomPassword(length: number = 10): string {
        let pw = ``;
        const characters = `abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789`;
        // set charactersLengthPower2 to characters.length rounded up to the next power of two
        let charactersLengthPower2 = 1;
        while (characters.length > charactersLengthPower2) {
            charactersLengthPower2 *= 2;
        }
        while (pw.length < length) {
            const random = new Uint8Array(length - pw.length);
            window.crypto.getRandomValues(random);
            for (let i = 0; i < random.length; i++) {
                const r = random[i] % charactersLengthPower2;
                if (r < characters.length) {
                    pw += characters.charAt(r);
                }
            }
        }
        return pw;
    }

    /**
     * Get the date of the last invitation email.
     *
     * @param user
     * @returns a localized string representation of the date/time the last email was sent;
     * or an empty string
     */
    public lastSentEmailTimeString(user: ViewUser): string {
        if (!user.user || !user.user.last_email_send) {
            return ``;
        }
        return new Date(user.user.last_email_send * 1000).toLocaleString(this.translate.currentLang);
    }

    /**
     * Tries to convert a given string into an user (representated by a `FullNameInformation`-object).
     * Names that don't fit the scheme given will be entered into the first_name field.
     *
     * Naming schemes are:
     * - firstSpaceLast: One or two space-separated words are assumed, matching
     * given name and surname
     * - lastCommaFirst: A comma is supposed to separate last name(s) from given name(s).
     * TODO: More advanced logic(s) to fit names
     *
     * @param inputUser A raw user string
     * @param schema optional hint on how to handle the strings.
     * @returns A `FullNameInformation`-object.
     */
    public parseStringIntoUser(inputUser: string, schema: StringNamingSchema = `firstSpaceLast`): FullNameInformation {
        const newUser: FullNameInformation = {
            username: ``,
            structure_level: () => ``,
            number: () => ``,
            first_name: ``,
            last_name: ``
        };
        const assignName = (nameParts: string[]) => {
            switch (nameParts.length) {
                case 1:
                    newUser.first_name = nameParts[0];
                    break;
                case 2:
                    newUser.first_name = nameParts[0];
                    newUser.last_name = nameParts[1];
                    break;
                default:
                    newUser.first_name = inputUser;
            }
        };
        if (schema === `lastCommaFirst`) {
            const commaSeparated = inputUser.split(`,`);
            assignName(commaSeparated.slice().reverse());
        } else if (schema === `firstSpaceLast`) {
            const splitUser = inputUser.split(` `);
            assignName(splitUser);
        }
        newUser.username = newUser.first_name! + newUser.last_name!;
        return newUser;
    }

    /**
     * Fetches the amount of all active users from backend
     *
     * TODO: Waits for backend
     * @returns the number of active users
     */
    public async fetchAllActiveUsers(): Promise<number> {
        if (!this.operator.hasOrganizationPermissions(OML.can_manage_users)) {
            return -1;
        }
        return await this.presenter.call();
    }
}