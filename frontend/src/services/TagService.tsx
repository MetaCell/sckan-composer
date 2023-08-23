import { composerApi } from "./apis";
import { Tag } from "../apiclient/backend";
import { AbstractService } from "./AbstractService";

export let tags = (function () {
  let tagList: Tag[] = [];

  return {
    // public interface
    setTagList: async function () {
      return composerApi.composerTagList(9999).then((resp: any) => {
        tagList = resp.data.results;
      });
    },
    getTagList: function (): Tag[] {
      return tagList;
    },
  };
})();

class TagService extends AbstractService {
  async save(tag: any) {
    const tagId: number | undefined = tags.getTagList().find((t: Tag) => t.tag === tag.tag)?.id
    if (tagId) {
      return tag.service.addTag(tag.parentId, tagId).then((response: any) => response)
    }
    return tag.service.getObject(tag.parentId).then((response: any) => response)
  }
  async getObject(id: string): Promise<Tag> {
    return {} as Tag
  }
}

const tagService = new TagService()
export default tagService
