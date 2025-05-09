const Contact = require("./contactModel");

const listContacts = async () => {
  return await Contact.find();
};

const getContactById = async (contactId) => {
  return await Contact.findById(contactId);
};

const addContact = async (body) => {
  return await Contact.create(body);
};

const updateContact = async (contactId, body) => {
  return await Contact.findByIdAndUpdate(contactId, body, { new: true });
};

const removeContact = async (contactId) => {
  return await Contact.findByIdAndDelete(contactId);
};

const updateStatusContact = async (contactId, body) => {
  const updatedContact = await Contact.findByIdAndUpdate(contactId, body, {
    new: true,
  });
  return updatedContact;
};

module.exports = {
  listContacts,
  getContactById,
  addContact,
  updateContact,
  removeContact,
  updateStatusContact,
};
