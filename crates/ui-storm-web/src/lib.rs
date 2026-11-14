//! The ui-storm gallery: the live component documentation.
//!
//! Every page is rendered by the same library the pages document, so a broken
//! component breaks the gallery, and the accessibility tests in `tests/` run
//! against real rendered HTML rather than fixtures.

#![forbid(unsafe_code)]

pub mod layout;
pub mod pages;
pub mod routes;

pub use routes::configure;
