import { composerApi } from "./apis";
import { } from "../apiclient/backend";
import { AbstractService } from "./AbstractService";

export let exportOptions = (function () {
  return {
    getOption: function () {
      return { id: 1, option: "Does this exist in SCKAN?" };
    },
  };
})();
