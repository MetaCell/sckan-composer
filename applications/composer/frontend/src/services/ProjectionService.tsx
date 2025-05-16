import { composerApi } from "./apis";
import { ProjectionPhenotype } from "../apiclient/backend";

export let projections = (function () {
	let projectionsList: ProjectionPhenotype[] = [];

	return {
		// public interface
		setProjections: async function () {
			return composerApi.composerProjectionList(undefined).then((resp: any) => {
				projectionsList = resp.data.results;
			});
		},
		getProjections: function (): ProjectionPhenotype[] {
			return projectionsList;
		},
	};
})();

