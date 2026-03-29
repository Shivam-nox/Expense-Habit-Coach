// Define this for Gemini
const recordTransactionTool = {
  name: "recordTransaction",
  description: "Add a new expense or income to the database",
  parameters: {
    type: "OBJECT",
    properties: {
      amount: { type: "NUMBER" },
      category: { type: "STRING" }, // Gemini maps 'Zepto' to 'Grocery' here
      type: { type: "STRING", enum: ["income", "expense"] },
      paymentMode: { type: "STRING", enum: ["cash", "upi", "card"] },
      intent: { type: "STRING", enum: ["need", "want"] }, // Pillar 8: Discipline
      note: { type: "STRING" }
    }
  }
};