import { composerApi } from "./apis";
import { Tag } from "../apiclient/backend";

export let tags = (function () {
  let tagList: Tag[] = [];

  return {
    // public interface
    setTagList: async function () {
      return composerApi.composerTagList(10).then((resp: any) => {
        tagList = resp.data.results;
      });
    },
    getTagList: function (): Tag[] {
      return tagList;
    },
  };
})();
