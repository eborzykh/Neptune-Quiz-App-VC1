# Creation history

Prompts that shaped this app, in chronological order:

1. **Quiz selection**

   > create UI5 app which lets user select a Quiz from the data source /sap/opu/odata/sap/ZNEPT_QZ_UI_QUIZ_R_O2

   The generated service-directory screen was replaced with a quiz list backed by this OData service.

2. **Quiz gameplay**

   > alter the app. make user select a quiz from the list and play it.

   The app gained a quiz flow with single-choice, multi-select, and free-text answers, feedback, explanations, progress, and a final score.

3. **Browser run**

   > run the app in browser

   The app was launched locally and checked against the live OData service.

4. **Repository upload**

   > upload this app and the history of creation with my prompts in https://github.com/eborzykh/Neptune-Quiz-App-VC1.git

5. **Alter the app**

   > update the app to display only published quizzes (where flag Published=X) and make search by quiz Description

   Now the app displays only published quizzes and ready for taking screenshots.

6. **Create README.md file**

   > update readme.md file. add envieronment (backend, tools, langueges) data structure and include screenshots of user experience in the app
      
   > add section with dependencies and promote https://github.com/eborzykh/Neptune-Quiz-App-CDS
   
   Some adjustment were made manually before posting README.md file.

8. **Publishing**

   > check this repository and let me know is it safe to make it public

   There are no obvious passwords or API keys in the files inspected, but the repository currently exposes potentially sensitive infrastructure information.
