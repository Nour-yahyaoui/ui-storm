//! HTTP surface of the gallery.
//!
//! Language and theme are query parameters rather than client state, so every
//! page has one URL, renders the same bytes on the server, and can be checked
//! by a test or a crawler without a browser.

use actix_web::http::{header, StatusCode};
use actix_web::{web, HttpRequest, HttpResponse};
use maud::Markup;
use serde::Deserialize;
use ui_storm::tokens::Theme;
use ui_storm::{assets, locale_direction, Direction};

use crate::layout::PageContext;
use crate::pages;

/// Language used when the request does not ask for one.
pub const DEFAULT_LANG: &str = "en";

/// Query parameters understood by every page.
#[derive(Debug, Default, Deserialize)]
pub struct PageQuery {
    /// BCP-47 language tag, e.g. `ar` or `az-Arab`.
    pub lang: Option<String>,
    /// `light` or `dark`.
    pub theme: Option<String>,
}

fn context(req: &HttpRequest, query: &PageQuery, title: &str) -> PageContext {
    let lang = query
        .lang
        .as_deref()
        .map(str::trim)
        .filter(|tag| !tag.is_empty())
        .unwrap_or(DEFAULT_LANG);
    let theme = match query.theme.as_deref() {
        Some("dark") => Theme::Dark,
        _ => Theme::Light,
    };
    let dir = locale_direction(lang);

    PageContext::new(title, req.path(), lang, dir, theme)
}

fn html(status: StatusCode, markup: Markup) -> HttpResponse {
    HttpResponse::build(status)
        .content_type("text/html; charset=utf-8")
        .insert_header((header::CACHE_CONTROL, "no-store"))
        .body(markup.into_string())
}

async fn overview(req: HttpRequest, query: web::Query<PageQuery>) -> HttpResponse {
    let ctx = context(&req, &query, "Accessibility-first components for Rust");
    let page = ctx.render(pages::overview(&ctx));
    html(StatusCode::OK, page)
}

async fn foundations(req: HttpRequest, query: web::Query<PageQuery>) -> HttpResponse {
    let ctx = context(&req, &query, "Foundations");
    let page = ctx.render(pages::foundations(&ctx));
    html(StatusCode::OK, page)
}

async fn accessibility(req: HttpRequest, query: web::Query<PageQuery>) -> HttpResponse {
    let ctx = context(&req, &query, "Accessibility");
    let page = ctx.render(pages::accessibility(&ctx));
    html(StatusCode::OK, page)
}

async fn component(
    req: HttpRequest,
    name: web::Path<String>,
    query: web::Query<PageQuery>,
) -> HttpResponse {
    let name = name.into_inner();
    let ctx = context(&req, &query, "Components");

    match pages::component(&name, &ctx) {
        Some(content) => {
            let titled = PageContext::new(
                component_title(&name).unwrap_or("Components"),
                ctx.path.clone(),
                ctx.lang.clone(),
                ctx.dir,
                ctx.theme,
            );
            let page = titled.render(content);
            html(StatusCode::OK, page)
        }
        None => {
            let ctx = context(&req, &query, "Page not found");
            let page = ctx.render(pages::not_found(&ctx));
            html(StatusCode::NOT_FOUND, page)
        }
    }
}

fn component_title(name: &str) -> Option<&'static str> {
    match name {
        "button" => Some("Button"),
        "icon-button" => Some("Icon button"),
        "text-input" => Some("Text input"),
        "checkbox" => Some("Checkbox"),
        "dialog" => Some("Dialog"),
        "tabs" => Some("Tabs"),
        _ => None,
    }
}

async fn rtl(req: HttpRequest, query: web::Query<PageQuery>) -> HttpResponse {
    // This page exists to be Arabic; a query parameter cannot turn it around.
    let mut ctx = context(&req, &query, "من اليمين إلى اليسار");
    ctx.lang = String::from("ar");
    ctx.dir = Direction::Rtl;
    let page = ctx.render(pages::rtl_demo(&ctx));
    html(StatusCode::OK, page)
}

async fn stylesheet() -> HttpResponse {
    HttpResponse::Ok()
        .content_type("text/css; charset=utf-8")
        .insert_header((header::CACHE_CONTROL, "public, max-age=300"))
        .body(assets::CSS)
}

async fn script() -> HttpResponse {
    HttpResponse::Ok()
        .content_type("text/javascript; charset=utf-8")
        .insert_header((header::CACHE_CONTROL, "public, max-age=300"))
        .body(assets::SCRIPT)
}

async fn healthz() -> HttpResponse {
    HttpResponse::Ok()
        .content_type("text/plain; charset=utf-8")
        .body("ok")
}

async fn favicon() -> HttpResponse {
    HttpResponse::NoContent().finish()
}

async fn not_found(req: HttpRequest, query: web::Query<PageQuery>) -> HttpResponse {
    let ctx = context(&req, &query, "Page not found");
    let page = ctx.render(pages::not_found(&ctx));
    html(StatusCode::NOT_FOUND, page)
}

/// Registers every route. Shared by the binary and by the HTTP tests.
pub fn configure(cfg: &mut web::ServiceConfig) {
    cfg.route("/", web::get().to(overview))
        .route("/foundations", web::get().to(foundations))
        .route("/accessibility", web::get().to(accessibility))
        .route("/rtl", web::get().to(rtl))
        .route("/components/{name}", web::get().to(component))
        .route("/assets/ui-storm.css", web::get().to(stylesheet))
        .route("/assets/ui-storm.js", web::get().to(script))
        .route("/healthz", web::get().to(healthz))
        .route("/favicon.ico", web::get().to(favicon))
        .default_service(web::to(not_found));
}
