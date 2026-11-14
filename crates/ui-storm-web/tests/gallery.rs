//! HTTP contract of the gallery.
//!
//! These tests exercise the real Actix app: the same `configure` the binary
//! uses, the same handlers, the same rendered markup that a browser receives.

use actix_web::http::header;
use actix_web::{test, App};
use ui_storm_web::configure;

struct Response {
    status: u16,
    content_type: String,
    body: String,
}

async fn get(uri: &str) -> Response {
    let app = test::init_service(App::new().configure(configure)).await;
    let request = test::TestRequest::get().uri(uri).to_request();
    let response = test::call_service(&app, request).await;

    let status = response.status().as_u16();
    let content_type = response
        .headers()
        .get(header::CONTENT_TYPE)
        .and_then(|value| value.to_str().ok())
        .unwrap_or_default()
        .to_string();
    let body = test::read_body(response).await;
    let body = String::from_utf8(body.to_vec()).expect("the gallery serves UTF-8");

    Response {
        status,
        content_type,
        body,
    }
}

const PAGES: &[&str] = &[
    "/",
    "/foundations",
    "/accessibility",
    "/rtl",
    "/components/button",
    "/components/icon-button",
    "/components/text-input",
    "/components/checkbox",
    "/components/dialog",
    "/components/tabs",
];

#[actix_web::test]
async fn every_page_renders_one_h1_and_the_skip_link() {
    for page in PAGES {
        let response = get(page).await;
        assert_eq!(response.status, 200, "{page} did not render");
        assert!(
            response.content_type.starts_with("text/html"),
            "{page} content type was {}",
            response.content_type
        );
        assert!(response.body.starts_with("<!DOCTYPE html>"), "{page}");
        assert_eq!(
            response.body.matches("<h1").count(),
            1,
            "{page} should have exactly one h1"
        );
        assert!(
            response.body.contains("class=\"ui-skip-link\" href=\"#content\""),
            "{page} is missing the skip link"
        );
        assert!(
            response.body.contains("<main class=\"ui-gallery__main ui-prose\" id=\"content\""),
            "{page} lost the skip link target"
        );
    }
}

#[actix_web::test]
async fn components_are_rendered_in_the_page_not_fetched_by_script() {
    let response = get("/components/button").await;
    assert!(response.body.contains("<button type=\"button\""), "no server-rendered button");
    assert!(response.body.contains("ui-button--primary"));

    let tabs = get("/components/tabs").await;
    assert!(tabs.body.contains("role=\"tablist\""));
    assert!(tabs.body.contains("role=\"tabpanel\""));
}

#[actix_web::test]
async fn default_language_is_english_and_left_to_right() {
    let response = get("/").await;
    assert!(response.body.contains("<html lang=\"en\" dir=\"ltr\""), "got a different html element");
}

#[actix_web::test]
async fn arabic_locale_switches_language_and_direction_together() {
    let response = get("/?lang=ar").await;
    assert!(
        response.body.contains("<html lang=\"ar\" dir=\"rtl\""),
        "lang and dir must change together"
    );
}

#[actix_web::test]
async fn direction_follows_the_script_subtag() {
    // Arabic script written in Azerbaijani: the subtag wins over the base language.
    let response = get("/?lang=az-Arab").await;
    assert!(response.body.contains("dir=\"rtl\""), "az-Arab should be right to left");
}

#[actix_web::test]
async fn the_rtl_page_is_arabic_whatever_the_query_says() {
    let response = get("/rtl?lang=en").await;
    assert_eq!(response.status, 200);
    assert!(response.body.contains("<html lang=\"ar\" dir=\"rtl\""));
    assert!(response.body.contains("dir=\"rtl\""));
}

#[actix_web::test]
async fn theme_is_a_server_side_decision() {
    let dark = get("/?theme=dark").await;
    assert!(dark.body.contains("data-theme=\"dark\""));

    let light = get("/").await;
    assert!(light.body.contains("data-theme=\"light\""));
}

#[actix_web::test]
async fn the_current_page_is_marked_for_assistive_technology() {
    let response = get("/components/tabs").await;
    assert_eq!(
        response.body.matches("aria-current=\"page\"").count(),
        1,
        "exactly one navigation link is current"
    );
    assert!(response.body.contains("href=\"/components/tabs?lang=en&amp;theme=light\""));
}

#[actix_web::test]
async fn component_pages_show_the_library_output_escaped() {
    let response = get("/components/button").await;
    assert!(response.body.contains("<pre class=\"ui-code\"><code>&lt;button"));
}

#[actix_web::test]
async fn foundations_page_reports_real_contrast_ratios() {
    let response = get("/foundations").await;
    assert!(response.body.contains("4.5:1"), "the threshold is stated");
    assert!(response.body.contains("18.1"), "the measured body-text ratio is rendered");
}

#[actix_web::test]
async fn accessibility_page_states_the_rules_and_the_limits() {
    let response = get("/accessibility").await;
    assert!(response.body.contains("Known limits"));
    assert!(response.body.contains("prefers-reduced-motion") || response.body.contains("Escape"));
}

#[actix_web::test]
async fn unknown_pages_and_components_return_404() {
    for uri in ["/components/date-picker", "/nope"] {
        let response = get(uri).await;
        assert_eq!(response.status, 404, "{uri} should be a 404");
        assert!(response.body.contains("<h1>Page not found</h1>"), "{uri} body");
    }
}

#[actix_web::test]
async fn stylesheet_and_script_are_served_with_the_right_types() {
    let css = get("/assets/ui-storm.css").await;
    assert_eq!(css.status, 200);
    assert!(css.content_type.starts_with("text/css"));
    assert!(css.body.contains("--ui-color-bg"));
    assert!(css.body.contains("prefers-reduced-motion"));

    let js = get("/assets/ui-storm.js").await;
    assert_eq!(js.status, 200);
    assert!(js.content_type.starts_with("text/javascript"));
    assert!(js.body.contains("showModal"));
}

#[actix_web::test]
async fn health_check_is_cheap_and_plain() {
    let response = get("/healthz").await;
    assert_eq!(response.status, 200);
    assert_eq!(response.body, "ok");
}

#[actix_web::test]
async fn every_page_ships_the_noscript_fallback_for_tabs() {
    let response = get("/components/tabs").await;
    assert!(response.body.contains("<noscript>"));
    assert!(response.body.contains(".ui-tabs__panel[hidden]"));
}

#[actix_web::test]
async fn pages_never_leak_unanchored_aria_references() {
    for page in ["/components/dialog", "/components/tabs", "/components/text-input"] {
        let response = get(page).await;
        let body = &response.body;
        let ids = collect(body, "id=\"");
        let named = collect(body, "aria-labelledby=\"");
        let described = collect(body, "aria-describedby=\"");
        for reference in named.iter().chain(described.iter()) {
            for target in reference.split_whitespace() {
                assert!(
                    ids.iter().any(|id| id == target),
                    "{page}: {target} is referenced but not defined"
                );
            }
        }
    }
}

fn collect(html: &str, needle: &str) -> Vec<String> {
    let mut out = Vec::new();
    let mut rest = html;
    while let Some(position) = rest.find(needle) {
        let after = &rest[position + needle.len()..];
        match after.find('"') {
            Some(end) => {
                out.push(after[..end].to_string());
                rest = &after[end + 1..];
            }
            None => break,
        }
    }
    out
}
