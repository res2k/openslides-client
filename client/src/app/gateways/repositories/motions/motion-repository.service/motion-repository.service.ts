import { Injectable } from '@angular/core';
import { ViewMotion } from 'src/app/site/pages/meetings/pages/motions';
import { Motion } from '../../../../domain/models/motions/motion';
import { RepositoryMeetingServiceCollectorService } from '../../repository-meeting-service-collector.service';
import { BaseAgendaItemAndListOfSpeakersContentObjectRepository } from '../../base-agenda-item-and-list-of-speakers-content-object-repository';
import { AgendaItemRepositoryService, createAgendaItem } from '../../agenda';
import { Identifiable } from 'src/app/domain/interfaces';
import { MotionAction } from './motion.action';
import { Id } from 'src/app/domain/definitions/key-types';
import {
    DEFAULT_FIELDSET,
    Fieldsets,
    ROUTING_FIELDSET,
    TypedFieldset
} from 'src/app/site/services/model-request-builder';
import { AgendaListTitle } from 'src/app/site/pages/meetings/pages/agenda';
import { TreeIdNode } from 'src/app/infrastructure/definitions/tree';
import { Action } from 'src/app/gateways/actions';
import { AmendmentAction } from './amendment.action';
import { NullablePartial } from 'src/app/infrastructure/utils';
import { Observable, map } from 'rxjs';

type SortProperty = 'sort_weight' | 'number';

@Injectable({
    providedIn: 'root'
})
export class MotionRepositoryService extends BaseAgendaItemAndListOfSpeakersContentObjectRepository<
    ViewMotion,
    Motion
> {
    /**
     * The property the incoming data is sorted by
     */
    protected sortProperty: SortProperty = `number`;

    constructor(
        repositoryServiceCollector: RepositoryMeetingServiceCollectorService,
        agendaItemRepo: AgendaItemRepositoryService
    ) {
        super(repositoryServiceCollector, Motion, agendaItemRepo);
        this.meetingSettingsService.get(`motions_default_sorting`).subscribe(conf => {
            this.sortProperty = conf as SortProperty;
            this.setConfigSortFn();
        });
    }

    public override getViewModelList(): ViewMotion[] {
        return this.getCurrentMotions(super.getViewModelList());
    }

    public override getViewModelListObservable(): Observable<ViewMotion[]> {
        return super.getViewModelListObservable().pipe(map(motions => this.getCurrentMotions(motions)));
    }

    public create(...motions: NullablePartial<Motion>[]): Promise<Identifiable[]> {
        const payload = motions.map(motion => this.getCreatePayload(motion));
        return this.sendBulkActionToBackend(MotionAction.CREATE, payload);
    }

    public createForwarded(meetingIds: Id[], ...motions: any[]): Promise<void> {
        const payload = meetingIds.flatMap(id =>
            motions.map(motion => ({
                meeting_id: id,
                ...motion
            }))
        );
        return this.sendBulkActionToBackend(MotionAction.CREATE_FORWARDED, payload);
    }

    public update(update: NullablePartial<Motion>, ...viewMotions: ViewMotion[]): Action<void> {
        const payload = viewMotions.map(motion => this.getUpdatePayload(update, motion));
        return this.createAction(MotionAction.UPDATE, payload);
    }

    public delete(...viewMotions: Identifiable[]): Promise<void> {
        const payload: Identifiable[] = viewMotions.map(motion => ({ id: motion.id }));
        return this.sendBulkActionToBackend(MotionAction.DELETE, payload);
    }

    /**
     * Set the state of a motion
     *
     * @param viewMotions target motion
     * @param stateId the number that indicates the state
     */
    public setState(stateId: Id | null, ...viewMotions: Motion[]): Action<void> {
        const payload = viewMotions
            .filter(motion => motion.state_id !== stateId)
            .map(viewMotion => ({
                id: viewMotion.id,
                state_id: stateId
            }));
        return this.createAction(MotionAction.SET_STATE, payload);
    }

    public resetState(...viewMotions: Identifiable[]): Action<void> {
        const payload = viewMotions.map(viewMotion => ({ id: viewMotion.id }));
        return this.createAction(MotionAction.RESET_STATE, payload);
    }

    /**
     * Set the recommenders state of a motion
     *
     * @param viewMotions target motion
     * @param recommendationId the number that indicates the recommendation
     */
    public setRecommendation(recommendationId: number, ...viewMotions: Motion[]): Action<void> {
        const payload = viewMotions
            .filter(motion => motion.recommendation_id !== recommendationId)
            .map(viewMotion => ({
                id: viewMotion.id,
                recommendation_id: recommendationId
            }));
        return this.createAction(MotionAction.SET_RECOMMENDATION, payload);
    }

    public resetRecommendation(...viewMotions: Identifiable[]): Action<void> {
        const payload = viewMotions.map(viewMotion => ({ id: viewMotion.id }));
        return this.createAction(MotionAction.RESET_RECOMMENDATION, payload);
    }

    /**
     * Sends the changed nodes to the server.
     *
     * @param data The reordered data from the sorting
     */
    public async sortMotions(data: TreeIdNode[]): Promise<void> {
        const payload = {
            meeting_id: this.activeMeetingId,
            tree: this.createSortTree(data)
        };
        return await this.sendActionToBackend(MotionAction.SORT, payload);
    }

    /**
     * Supports the motion
     *
     * @param motion target motion
     */
    public async support(motion: Identifiable): Promise<void> {
        const payload = { motion_id: motion.id, support: true };
        await this.sendActionToBackend(MotionAction.SET_SUPPORT_SELF, payload);
    }

    /**
     * Unsupports the motion
     *
     * @param motion target motion
     */
    public async unsupport(motion: Identifiable): Promise<void> {
        const payload = { motion_id: motion.id, support: false };
        await this.sendActionToBackend(MotionAction.SET_SUPPORT_SELF, payload);
    }

    /**
     * Signals the acceptance of the current recommendation of this motionBlock
     */
    public async followRecommendation(...motions: Identifiable[]): Promise<void> {
        const payload = motions.map(identifiable => ({ id: identifiable.id }));
        return this.sendBulkActionToBackend(MotionAction.FOLLOW_RECOMMENDATION, payload);
    }

    public createTextBased(partialMotion: Partial<Motion>): Action<Identifiable> {
        const payload = {
            meeting_id: this.activeMeetingIdService.meetingId,
            lead_motion_id: partialMotion.lead_motion_id,
            title: partialMotion.title,
            text: partialMotion.text,
            origin_id: partialMotion.origin_id,
            submitter_ids: partialMotion.submitter_ids,
            workflow_id: partialMotion.workflow_id,
            category_id: partialMotion.category_id,
            attachment_ids: partialMotion.attachment_ids,
            reason: partialMotion.reason,
            number: partialMotion.number,
            block_id: partialMotion.block_id,
            state_extension: partialMotion.state_extension,
            sort_parent_id: partialMotion.sort_parent_id,
            tag_ids: partialMotion.tag_ids,
            supporter_ids: partialMotion.supporter_ids,
            ...createAgendaItem(partialMotion)
        };
        return this.createAction(AmendmentAction.CREATE_TEXTBASED_AMENDMENT, payload);
    }

    public createParagraphBased(partialMotion: Partial<Motion>): Action<Identifiable> {
        const payload = {
            meeting_id: this.activeMeetingIdService.meetingId,
            lead_motion_id: partialMotion.lead_motion_id,
            title: partialMotion.title,
            origin_id: partialMotion.origin_id,
            submitter_ids: partialMotion.submitter_ids === null ? [] : partialMotion.submitter_ids,
            workflow_id: partialMotion.workflow_id,
            category_id: partialMotion.category_id,
            attachment_ids: partialMotion.attachment_ids === null ? [] : partialMotion.attachment_ids,
            reason: partialMotion.reason,
            number: partialMotion.number,
            block_id: partialMotion.block_id,
            state_extension: partialMotion.state_extension,
            amendment_paragraph_$: partialMotion.amendment_paragraph_$,
            sort_parent_id: partialMotion.sort_parent_id,
            tag_ids: partialMotion.tag_ids === null ? [] : partialMotion.tag_ids,
            supporter_ids: partialMotion.supporter_ids === null ? [] : partialMotion.supporter_ids,
            ...createAgendaItem(partialMotion)
        };
        return this.createAction(AmendmentAction.CREATE_PARAGRAPHBASED_AMENDMENT, payload);
    }

    public createStatuteAmendment(partialMotion: Partial<Motion>): Action<Identifiable> {
        const payload = {
            meeting_id: this.activeMeetingIdService.meetingId,
            title: partialMotion.title,
            text: partialMotion.text,
            origin_id: partialMotion.origin_id,
            submitter_ids: partialMotion.submitter_ids,
            workflow_id: partialMotion.workflow_id,
            category_id: partialMotion.category_id,
            attachment_ids: partialMotion.attachment_ids,
            reason: partialMotion.reason,
            number: partialMotion.number,
            block_id: partialMotion.block_id,
            state_extension: partialMotion.state_extension,
            statute_paragraph_id: partialMotion.statute_paragraph_id,
            sort_parent_id: partialMotion.sort_parent_id,
            tag_ids: partialMotion.tag_ids,
            supporter_ids: partialMotion.supporter_ids,
            ...createAgendaItem(partialMotion)
        };
        return this.createAction(AmendmentAction.CREATE_STATUTEBASED_AMENDMENT, payload);
    }

    public override getFieldsets(): Fieldsets<Motion> {
        const routingFields: TypedFieldset<Motion> = [`sequential_number`];
        const titleFields: TypedFieldset<Motion> = routingFields.concat([`title`, `number`, `created`, `forwarded`]);
        const detailFields: TypedFieldset<Motion> = titleFields.concat([
            `sort_weight`,
            `start_line_number`,
            `category_weight`,
            `lead_motion_id`, // needed for filtering
            `amendment_ids`,
            `submitter_ids`,
            `sequential_number`,
            `reason`,
            `recommendation_id`,
            `tag_ids`,
            `personal_note_ids`,
            `block_id`,
            `category_id`,
            `lead_motion_id`,
            `comment_ids`,
            `modified_final_version`,
            `state_extension`,
            `recommendation_extension`,
            `list_of_speakers_id`,
            `agenda_item_id`, // for add/remove from agenda,
            { templateField: `amendment_paragraph_$` },
            `all_origin_ids`,
            `derived_motion_ids`,
            `poll_ids`,
            `origin_id`,
            `sort_weight`,
            `sort_parent_id`,
            `state_id`,
            `workflow_id`,
            `text`,
            `change_recommendation_ids`,
            `attachment_ids`
        ]);
        return {
            [DEFAULT_FIELDSET]: detailFields,
            [ROUTING_FIELDSET]: routingFields
        };
    }

    public getTitle = (viewMotion: ViewMotion) => {
        if (viewMotion.number) {
            return `${viewMotion.number}: ${viewMotion.title}`;
        } else {
            return viewMotion.title;
        }
    };

    public getNumberOrTitle = (viewMotion: ViewMotion) => {
        if (viewMotion.number) {
            return viewMotion.number;
        } else {
            return viewMotion.title;
        }
    };

    public override getAgendaSlideTitle = (viewMotion: ViewMotion) => {
        const numberPrefix = this.agendaItemRepo.getItemNumberPrefix(viewMotion);
        // if the number is set, the title will be 'Motion <number>'.
        if (viewMotion.number) {
            return `${numberPrefix} ${this.translate.instant(`Motion`)} ${viewMotion.number}`;
        } else {
            return `${numberPrefix} ${viewMotion.title}`;
        }
    };

    public override getAgendaListTitle = (viewMotion: ViewMotion) => {
        const numberPrefix = this.agendaItemRepo.getItemNumberPrefix(viewMotion);
        // Append the verbose name only, if not the special format 'Motion <number>' is used.
        let title: string;
        if (viewMotion.number) {
            title = `${numberPrefix}${this.translate.instant(`Motion`)} ${viewMotion.number} · ${viewMotion.title}`;
        } else {
            title = `${numberPrefix}${viewMotion.title} (${this.getVerboseName()})`;
        }
        const agendaTitle: AgendaListTitle = { title };

        if (viewMotion.submittersAsUsers && viewMotion.submittersAsUsers.length) {
            agendaTitle.subtitle = `${this.translate.instant(`by`)} ${viewMotion.submittersAsUsers.join(`, `)}`;
        }
        return agendaTitle;
    };

    public getVerboseName = (plural: boolean = false) => this.translate.instant(plural ? `Motions` : `Motion`);

    public getProjectorTitle = (viewMotion: ViewMotion) => {
        const subtitle =
            viewMotion.agenda_item && viewMotion.agenda_item.comment ? viewMotion.agenda_item.comment : undefined;
        return { title: this.getTitle(viewMotion), subtitle };
    };

    protected override createViewModel(model: Motion): ViewMotion {
        const viewModel = super.createViewModel(model);

        viewModel.getNumberOrTitle = () => this.getNumberOrTitle(viewModel);
        viewModel.getProjectorTitle = () => this.getProjectorTitle(viewModel);

        return viewModel;
    }

    private getCreatePayload(partialMotion: any): any {
        return {
            meeting_id: this.activeMeetingId,
            title: partialMotion.title,
            text: partialMotion.text,
            origin_id: partialMotion.origin_id,
            submitter_ids: partialMotion.submitter_ids,
            workflow_id: partialMotion.workflow_id,
            category_id: partialMotion.category_id,
            attachment_ids: partialMotion.attachment_ids === null ? [] : partialMotion.attachment_ids,
            reason: partialMotion.reason,
            number: partialMotion.number,
            block_id: partialMotion.block_id,
            state_extension: partialMotion.state_extension,
            sort_parent_id: partialMotion.sort_parent_id,
            tag_ids: partialMotion.tag_ids === null ? [] : partialMotion.tag_ids,
            supporter_ids: partialMotion.supporter_ids === null ? [] : partialMotion.supporter_ids,
            ...createAgendaItem(partialMotion)
        };
    }

    private getUpdatePayload(update: any, viewMotion: ViewMotion): any {
        const updatePayload = Object.keys(update).mapToObject(key => {
            if (JSON.stringify(update[key]) !== JSON.stringify(viewMotion[key as keyof ViewMotion])) {
                return { [key]: update[key] };
            }
            return {};
        });
        return {
            id: viewMotion.id,
            ...updatePayload,
            supporter_ids: updatePayload[`supporter_ids`] === null ? [] : updatePayload[`supporter_ids`],
            tag_ids: updatePayload[`tag_ids`] === null ? [] : updatePayload[`tag_ids`],
            attachment_ids: updatePayload[`attachment_ids`] === null ? [] : updatePayload[`attachment_ids`]
        };
    }

    /**
     * Triggers an update for the sort function responsible for the default sorting of data items
     */
    private setConfigSortFn(): void {
        this.setSortFunction((a: ViewMotion, b: ViewMotion) => {
            if (a[this.sortProperty] && b[this.sortProperty]) {
                if (a[this.sortProperty] === b[this.sortProperty]) {
                    return this.languageCollator.compare(a.title, b.title);
                } else {
                    if (this.sortProperty === `sort_weight`) {
                        // handling numerical values
                        return a.sort_weight - b.sort_weight;
                    } else {
                        return this.languageCollator.compare(a[this.sortProperty], b[this.sortProperty]);
                    }
                }
            } else if (a[this.sortProperty]) {
                return -1;
            } else if (b[this.sortProperty]) {
                return 1;
            } else {
                return this.languageCollator.compare(a.title, b.title);
            }
        });
    }

    /**
     * Helper-function to avoid transmitting more than `id` and `children` to the backend.
     *
     * @returns Either an array of `TreeIdNode` or `undefined`
     */
    private createSortTree(data: TreeIdNode[] | undefined): TreeIdNode[] | undefined {
        if (!data) {
            return undefined;
        }
        return data.map(node => ({ id: node.id, children: this.createSortTree(node.children) }));
    }

    private getCurrentMotions(motions: ViewMotion[]): ViewMotion[] {
        return motions.filter(motion => motion.meeting_id === this.activeMeetingId);
    }
}