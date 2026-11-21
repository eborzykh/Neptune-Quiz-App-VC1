# Quiz Player

This UI5 app lets users browse quizzes from
`/sap/opu/odata/sap/ZNEPT_QZ_UI_QUIZ_R_O2/`, select one, and play through its
questions. It supports single-choice, multiple-choice, and free-text answers,
shows feedback and explanations, and displays a final score. The SAP system
must grant the signed-in user access to the service.

Run the app with `npm start`. The UI5 development proxy in `ui5.yaml` forwards
`/sap` requests to the configured backend.
