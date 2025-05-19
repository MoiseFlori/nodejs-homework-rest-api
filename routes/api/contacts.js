const express = require("express");
const router = express.Router();
const {
  listContacts,
  getContactById,
  removeContact,
  addContact,
  updateContact,
  updateStatusContact,
} = require("../../models/contacts");
const { contactSchema } = require("../../validation/contactsValidation");

// GET /api/contacts
router.get("/", async (req, res, next) => {
  try {
    const { page = 1, limit = 20, favorite } = req.query;

    const skip = (page - 1) * limit;

    const filter = {};
    if (favorite !== undefined) {
      filter.favorite = favorite === "true"; 
    }

    const contacts = await listContacts({
      filter,
      skip: Number(skip),
      limit: Number(limit),
    });

    res.status(200).json(contacts);
  } catch (error) {
    next(error);
  }
});


// GET /api/contacts/:contactId
router.get("/:contactId", async (req, res, next) => {
  try {
    const { contactId } = req.params;
    const contact = await getContactById(contactId);
    if (!contact) {
      return res.status(404).json({ message: "Not found" });
    }
    res.status(200).json(contact);
  } catch (error) {
    next(error);
  }
});

// POST /api/contacts
router.post("/", async (req, res, next) => {
  try {
   
    await contactSchema.validateAsync(req.body);
    const { name, email, phone, favorite } = req.body;
    const newContact = await addContact({ name, email, phone, favorite });

    res.status(201).json(newContact);
  } catch (error) {
    if (error.isJoi) {
      return res.status(400).json({ message: error.message });
    }
    next(error);
  }
});

// PUT /api/contacts/:contactId
router.put("/:contactId", async (req, res, next) => {
  try {
    await contactSchema.validateAsync(req.body);
    const { contactId } = req.params;
    const body = req.body;
    const updatedContact = await updateContact(contactId, body);
    if (!updatedContact) {
      return res.status(404).json({ message: "Not found" });
    }
    res.status(200).json(updatedContact);
  } catch (error) {
    if (error.isJoi) {
      return res.status(400).json({ message: error.message });
    }
    next(error);
  }
});

// DELETE /api/contacts/:contactId
router.delete("/:contactId", async (req, res, next) => {
  try {
    const { contactId } = req.params;
    const deletedContact = await removeContact(contactId);
    if (!deletedContact) {
      return res.status(404).json({ message: "Not found" });
    }
    res.status(200).json({ message: "contact deleted" });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/contacts/:contactId/favorite
router.patch("/:contactId/favorite", async (req, res, next) => {
  try {
    const { favorite } = req.body;
    const { contactId } = req.params;

    if (favorite === undefined) {
      return res.status(400).json({ message: "missing field favorite" });
    }

    const updated = await updateStatusContact(contactId, { favorite });

    if (!updated) {
      return res.status(404).json({ message: "Not found" });
    }

    res.status(200).json(updated);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
