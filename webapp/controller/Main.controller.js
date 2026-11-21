sap.ui.define(
    [
        "sap/ui/core/mvc/Controller",
        "sap/ui/model/Filter",
        "sap/ui/model/FilterOperator",
        "sap/m/MessageBox",
        "sap/ui/model/json/JSONModel"
    ],
    function (Controller, Filter, FilterOperator, MessageBox, JSONModel) {
        "use strict";

        return Controller.extend("project14.controller.Main", {
            onInit: function () {
                this.getView().setModel(new JSONModel({}), "selection");
                this.getView().setModel(new JSONModel(this._createPlayState()), "play");
                this.getView().getModel("quiz").attachRequestFailed(this.onRequestFailed, this);
            },

            _createPlayState: function () {
                return {
                    Loading: false,
                    InProgress: false,
                    Completed: false,
                    Questions: [],
                    CurrentQuestion: {},
                    CurrentIndex: 0,
                    ProgressPercent: 0,
                    ProgressText: "",
                    SelectionMode: "None",
                    ActiveSelectionMode: "None",
                    IsFreeText: false,
                    SelectedVariantIds: [],
                    TextAnswer: "",
                    CanSubmit: false,
                    Submitted: false,
                    WasCorrect: false,
                    AnswerFeedback: "",
                    CorrectAnswerText: "",
                    Explanation: "",
                    Score: 0,
                    NextButtonText: ""
                };
            },

            onSearch: function (oEvent) {
                this._applyQuizFilters(oEvent.getSource().getValue().trim());
            },

            _applyQuizFilters: function (sQuery) {
                var aFilters = [];
                if (sQuery) {
                    var aSearchFilters = [
                        new Filter("Description", FilterOperator.Contains, sQuery)
                    ];

                    if (/^\d+$/.test(sQuery)) {
                        aSearchFilters.push(new Filter("TestId", FilterOperator.EQ, sQuery));
                    }

                    aFilters.push(new Filter({
                        filters: aSearchFilters,
                        and: false
                    }));
                }

                this.byId("quizTable").getBinding("items").filter(aFilters);
            },

            onQuizSelectionChange: function (oEvent) {
                var oSelectionModel = this.getView().getModel("selection");
                var oListItem = oEvent.getParameter("listItem");
                var oContext = oListItem && oListItem.getBindingContext("quiz");

                if (oEvent.getParameter("selected") && oContext) {
                    oSelectionModel.setData({
                        TestId: oContext.getProperty("TestId"),
                        Description: oContext.getProperty("Description")
                    });
                } else {
                    oSelectionModel.setData({});
                }
            },

            onPlayQuiz: function () {
                var oQuiz = this.getView().getModel("selection").getData();
                if (!oQuiz.TestId) {
                    return;
                }

                var oPlayModel = this.getView().getModel("play");
                oPlayModel.setData(this._createPlayState());
                oPlayModel.setProperty("/Loading", true);

                this.getView().getModel("quiz").read("/Variant", {
                    filters: [
                        new Filter("TestId", FilterOperator.EQ, oQuiz.TestId)
                    ],
                    success: function (oData) {
                        var aQuestions = this._groupVariants(oData.results || []);
                        oPlayModel.setProperty("/Loading", false);

                        if (!aQuestions.length) {
                            MessageBox.information(
                                this.getView().getModel("i18n").getResourceBundle().getText("noQuestions")
                            );
                            return;
                        }

                        oPlayModel.setProperty("/Quiz", oQuiz);
                        oPlayModel.setProperty("/Questions", aQuestions);
                        this._showQuestion(0);
                    }.bind(this),
                    error: function () {
                        oPlayModel.setProperty("/Loading", false);
                    }
                });
            },

            _groupVariants: function (aVariants) {
                var mQuestions = {};

                aVariants.forEach(function (oVariant) {
                    var sQuestionId = oVariant.QuestionId;
                    if (!mQuestions[sQuestionId]) {
                        mQuestions[sQuestionId] = {
                            QuestionId: sQuestionId,
                            Question: oVariant.Question,
                            Explanation: oVariant.Explanation,
                            Options: []
                        };
                    }

                    mQuestions[sQuestionId].Options.push({
                        VariantId: oVariant.VariantId,
                        Variant: oVariant.Variant,
                        Correct: oVariant.Correct
                    });
                });

                return Object.keys(mQuestions).map(function (sQuestionId) {
                    var oQuestion = mQuestions[sQuestionId];
                    oQuestion.Options.sort(function (a, b) {
                        return Number(a.VariantId) - Number(b.VariantId);
                    });
                    return oQuestion;
                }).sort(function (a, b) {
                    return Number(a.QuestionId) - Number(b.QuestionId);
                });
            },

            _showQuestion: function (iIndex) {
                var oPlayModel = this.getView().getModel("play");
                var aQuestions = oPlayModel.getProperty("/Questions");
                var oQuestion = aQuestions[iIndex];
                var aCorrectOptions = oQuestion.Options.filter(function (oOption) {
                    return oOption.Correct === "X";
                });
                var bIsFreeText = oQuestion.Options.length === 1 ||
                    /(?:type|enter|write)\b.*\b(answer|response)\b/i.test(oQuestion.Question);
                var sSelectionMode = aCorrectOptions.length > 1 ? "MultiSelect" : "SingleSelectLeft";
                var oBundle = this.getView().getModel("i18n").getResourceBundle();

                oPlayModel.setProperty("/CurrentIndex", iIndex);
                oPlayModel.setProperty("/CurrentQuestion", oQuestion);
                oPlayModel.setProperty("/ProgressPercent", Math.round(((iIndex + 1) / aQuestions.length) * 100));
                oPlayModel.setProperty("/ProgressText", oBundle.getText("questionProgress", [iIndex + 1, aQuestions.length]));
                oPlayModel.setProperty("/IsFreeText", bIsFreeText);
                oPlayModel.setProperty("/SelectionMode", bIsFreeText ? "None" : sSelectionMode);
                oPlayModel.setProperty("/ActiveSelectionMode", bIsFreeText ? "None" : sSelectionMode);
                oPlayModel.setProperty("/SelectedVariantIds", []);
                oPlayModel.setProperty("/TextAnswer", "");
                oPlayModel.setProperty("/CanSubmit", false);
                oPlayModel.setProperty("/Submitted", false);
                oPlayModel.setProperty("/WasCorrect", false);
                oPlayModel.setProperty("/AnswerFeedback", "");
                oPlayModel.setProperty("/CorrectAnswerText", "");
                oPlayModel.setProperty("/Explanation", "");
                oPlayModel.setProperty(
                    "/NextButtonText",
                    iIndex === aQuestions.length - 1 ? oBundle.getText("finishQuiz") : oBundle.getText("nextQuestion")
                );
                oPlayModel.setProperty("/InProgress", true);
                oPlayModel.setProperty("/Completed", false);
            },

            onAnswerSelectionChange: function (oEvent) {
                var oPlayModel = this.getView().getModel("play");
                if (oPlayModel.getProperty("/Submitted")) {
                    return;
                }

                var aSelectedIds = oEvent.getSource().getSelectedItems().map(function (oItem) {
                    return oItem.getBindingContext("play").getProperty("VariantId");
                });

                oPlayModel.setProperty("/SelectedVariantIds", aSelectedIds);
                oPlayModel.setProperty("/CanSubmit", aSelectedIds.length > 0);
            },

            onTextAnswerChange: function (oEvent) {
                var sValue = oEvent.getParameter("value");
                var oPlayModel = this.getView().getModel("play");
                oPlayModel.setProperty("/TextAnswer", sValue);
                oPlayModel.setProperty("/CanSubmit", !!sValue.trim());
            },

            onSubmitAnswer: function () {
                var oPlayModel = this.getView().getModel("play");
                if (!oPlayModel.getProperty("/CanSubmit") || oPlayModel.getProperty("/Submitted")) {
                    return;
                }

                var oQuestion = oPlayModel.getProperty("/CurrentQuestion");
                var aCorrectOptions = oQuestion.Options.filter(function (oOption) {
                    return oOption.Correct === "X";
                });
                var aAcceptedTextOptions = aCorrectOptions.length ? aCorrectOptions : oQuestion.Options;
                var bIsCorrect;

                if (oPlayModel.getProperty("/IsFreeText")) {
                    var sAnswer = this._normalizeAnswer(oPlayModel.getProperty("/TextAnswer"));
                    bIsCorrect = aAcceptedTextOptions.some(function (oOption) {
                        return this._normalizeAnswer(oOption.Variant) === sAnswer;
                    }, this);
                } else {
                    var aSelectedIds = oPlayModel.getProperty("/SelectedVariantIds");
                    bIsCorrect = aSelectedIds.length === aCorrectOptions.length &&
                        aSelectedIds.every(function (sSelectedId) {
                            return aCorrectOptions.some(function (oOption) {
                                return oOption.VariantId === sSelectedId;
                            });
                        });
                }

                var oBundle = this.getView().getModel("i18n").getResourceBundle();
                oPlayModel.setProperty("/Submitted", true);
                oPlayModel.setProperty("/WasCorrect", bIsCorrect);
                oPlayModel.setProperty(
                    "/AnswerFeedback",
                    oBundle.getText(bIsCorrect ? "answerCorrect" : "answerIncorrect")
                );
                oPlayModel.setProperty(
                    "/CorrectAnswerText",
                    (oPlayModel.getProperty("/IsFreeText") ? aAcceptedTextOptions : aCorrectOptions).map(function (oOption) {
                        return oOption.Variant;
                    }).join(", ")
                );
                oPlayModel.setProperty("/Explanation", oQuestion.Explanation);
                oPlayModel.setProperty("/ActiveSelectionMode", "None");
                if (bIsCorrect) {
                    oPlayModel.setProperty("/Score", oPlayModel.getProperty("/Score") + 1);
                }
            },

            _normalizeAnswer: function (sAnswer) {
                return String(sAnswer || "").trim().replace(/\s+/g, " ").toLowerCase();
            },

            onNextQuestion: function () {
                var oPlayModel = this.getView().getModel("play");
                var iNextIndex = oPlayModel.getProperty("/CurrentIndex") + 1;
                var aQuestions = oPlayModel.getProperty("/Questions");

                if (iNextIndex < aQuestions.length) {
                    this._showQuestion(iNextIndex);
                    return;
                }

                var oBundle = this.getView().getModel("i18n").getResourceBundle();
                oPlayModel.setProperty("/InProgress", false);
                oPlayModel.setProperty("/Completed", true);
                oPlayModel.setProperty(
                    "/ResultText",
                    oBundle.getText("quizResult", [oPlayModel.getProperty("/Score"), aQuestions.length])
                );
            },

            onExitQuiz: function () {
                var oPlayModel = this.getView().getModel("play");
                var oBundle = this.getView().getModel("i18n").getResourceBundle();

                MessageBox.confirm(oBundle.getText("quitQuizConfirm"), {
                    actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
                    onClose: function (sAction) {
                        if (sAction === MessageBox.Action.OK) {
                            oPlayModel.setData(this._createPlayState());
                        }
                    }.bind(this)
                });
            },

            onReturnToQuizzes: function () {
                this.getView().getModel("play").setData(this._createPlayState());
            },

            onRefresh: function () {
                this.byId("quizSearch").setValue("");
                this._applyQuizFilters("");
                this.byId("quizTable").removeSelections(true);
                this.getView().getModel("selection").setData({});
                this.getView().getModel("quiz").refresh(true);
            },

            onRequestFailed: function (oEvent) {
                var oBundle = this.getView().getModel("i18n").getResourceBundle();
                var sMessage = oEvent.getParameter("message");
                MessageBox.error(sMessage || oBundle.getText("quizLoadError"));
            }
        });
    }
);
