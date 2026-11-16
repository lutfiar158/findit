import assert from "node:assert/strict";
import test from "node:test";
import { validateAuth } from "./auth-validation.ts";

const valid = { name: "Mahasiswa", email: "demo@kampus.ac.id", password: "Sandi123", confirmation: "Sandi123" };

test("login rejects empty and malformed emails", () => {
  for (const email of ["", "   ", "email-tanpa-domain", "nama@", "a b@kampus.ac.id"]) {
    assert.notEqual(validateAuth({ ...valid, email }, "login"), null);
  }
});

test("login requires password but does not impose register minimum", () => {
  assert.notEqual(validateAuth({ ...valid, password: "" }, "login"), null);
  assert.equal(validateAuth({ email: "demo@kampus.ac.id", password: "lama" }, "login"), null);
});

test("registration requires a nonblank display name", () => {
  assert.notEqual(validateAuth({ ...valid, name: "   " }, "register"), null);
  assert.notEqual(validateAuth({ ...valid, name: undefined }, "register"), null);
});

test("registration rejects short passwords and mismatched confirmation", () => {
  assert.notEqual(validateAuth({ ...valid, password: "1234567", confirmation: "1234567" }, "register"), null);
  assert.notEqual(validateAuth({ ...valid, confirmation: "SandiLain" }, "register"), null);
  assert.notEqual(validateAuth({ ...valid, confirmation: undefined }, "register"), null);
});

test("valid registration including an eight-character password is accepted", () => {
  assert.equal(validateAuth(valid, "register"), null);
  assert.equal(validateAuth({ ...valid, email: " demo@kampus.ac.id " }, "register"), null);
});

test("register rejects display names exceeding the profile constraint", () => {
  assert.notEqual(validateAuth({ ...valid, name: "x".repeat(81) }, "register"), null);
});
