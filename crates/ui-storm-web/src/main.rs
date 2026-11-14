//! Starts the gallery.

#![forbid(unsafe_code)]

use actix_web::{App, HttpServer};

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    let host = std::env::var("HOST").unwrap_or_else(|_| String::from("0.0.0.0"));
    let port: u16 = std::env::var("PORT")
        .ok()
        .and_then(|value| value.parse().ok())
        .unwrap_or(8080);

    println!("ui-storm gallery listening on http://{host}:{port}");

    HttpServer::new(|| App::new().configure(ui_storm_web::configure))
        .bind((host.as_str(), port))?
        .run()
        .await
}
