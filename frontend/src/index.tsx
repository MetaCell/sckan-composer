import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";

import { doLogin } from "./services/UserService";
import { jsonSchemas } from "./services/JsonSchema";
import { tags } from "./services/TagService";
import { species } from "./services/SpecieService";
import { sexes } from "./services/SexService";
import { populations } from "./services/PopulationService";
import { phenotypes } from "./services/PhenotypeService";
import { projections } from "./services/ProjectionService";
import { Provider } from "react-redux";
import { store } from "./redux/store";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

doLogin().then(() => {
  jsonSchemas.initSchemas().then(() => {
    tags.setTagList().then(() => {
      species.setSpecieList().then(() => {
        sexes.setSexes().then(() => {
          populations.setPopulations().then(() => {
            phenotypes.setPhenotypes().then(() => {
              projections.setProjections().then(() => {
                root.render(
                  <Provider store={store}>
                    <App />
                  </Provider>
                );
              });
            });
          });
        });
      });
    });
  });
});
