import set from "lodash/set";
import get from "lodash/get";
import Error from "@webiny/error";
import { ApwContentTypes } from "~/types";
import { updatePageSettings } from "~/plugins/hooks/linkWorkflowToPage/utils";
import { InitiateContentReviewParams } from ".";

export const linkContentReviewToPage = ({ pageBuilder, apw }: InitiateContentReviewParams) => {
    apw.contentReview.onAfterContentReviewCreate.subscribe(async ({ contentReview }) => {
        const { content } = contentReview;

        if (content.type === ApwContentTypes.PAGE) {
            await updatePageSettings({
                getPage: pageBuilder.getPage,
                updatePage: pageBuilder.updatePage,
                uniquePageId: content.id,
                getNewSettings: settings => {
                    return set(settings, "apw.contentReviewId", contentReview.id);
                }
            });
        }
    });

    apw.contentReview.onAfterContentReviewDelete.subscribe(async ({ contentReview }) => {
        const { content } = contentReview;

        if (content.type === ApwContentTypes.PAGE) {
            await updatePageSettings({
                getPage: pageBuilder.getPage,
                updatePage: pageBuilder.updatePage,
                uniquePageId: content.id,
                getNewSettings: settings => {
                    return set(settings, "apw.contentReviewId", null);
                }
            });
        }
    });

    pageBuilder.onBeforePageDelete.subscribe(async ({ page }) => {
        const contentReviewId = get(page, "settings.apw.contentReviewId");
        if (contentReviewId) {
            throw new Error(
                `Cannot delete the page because a peer review has been requested. Please delete the review first.`,
                "CANNOT_DELETE_REVIEW_EXIST",
                {
                    contentReviewId,
                    page
                }
            );
        }
    });
};