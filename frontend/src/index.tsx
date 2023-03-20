import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";

import { doLogin } from "./services/UserService";
import { jsonSchemas } from "./services/JsonSchema";
import { tags } from "./services/TagService";
import { species } from "./services/SpecieService";
import { biologicalSexes } from "./services/BiologicalSexService";
import { ansDivisions } from "./services/AnsDivisionService";
import { Provider } from "react-redux";
import { store } from "./redux/store";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

doLogin().then(() => {
  jsonSchemas.initSchemas().then(() => {
    tags.setTagList().then(() => {
      species.setSpecieList().then(() => {
        biologicalSexes.setBiologicalSexes().then(() => {
          ansDivisions.setAnsDivisions().then(() => {
            root.render(
              <React.StrictMode>
                <Provider store={store}>
                  <App />
                </Provider>
              </React.StrictMode>
            );
          });
        });
      });
    });
  });
});
