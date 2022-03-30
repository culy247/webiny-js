import { useQuery } from "@apollo/react-hooks";
import get from "lodash/get";
import { GET_CONTENT_REVIEW_QUERY } from "~/graphql/contentReview.gql";
import { ApwContentReview } from "~/types";
import { useParams } from "@webiny/react-router";

interface UseContentReviewParams {
    id: string;
}

interface UseContentReviewResult {
    contentReview: ApwContentReview;
    loading: boolean;
}

export function useContentReview(params: UseContentReviewParams): UseContentReviewResult {
    const id = decodeURIComponent(params.id);

    const { data, loading } = useQuery(GET_CONTENT_REVIEW_QUERY, {
        variables: { id },
        skip: !id
    });
    return {
        contentReview: get(data, "apw.getContentReview.data"),
        loading
    };
}

export const useCurrentContentReview = (): UseContentReviewResult => {
    const { contentReviewId } = useParams() as { contentReviewId: string };
    return useContentReview({ id: contentReviewId });
};