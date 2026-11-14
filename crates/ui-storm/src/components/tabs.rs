//! Tabs — ARIA tabs with a no-JavaScript fallback.
//!
//! The markup is a complete ARIA tab widget: one tab stop, `aria-selected`,
//! `aria-controls`/`aria-labelledby` pairs and hidden inactive panels. The
//! enhancement script supplies roving arrow-key navigation, including the RTL
//! mapping. With JavaScript disabled a `<noscript>` rule in the page head reveals
//! every panel, so the content is never lost — the correct degradation for
//! navigation-driven tabs.

use maud::{html, Markup};

/// A single tab and its panel.
#[derive(Debug, Clone)]
pub struct Tab<'a> {
    /// Base id; the tab becomes `{id}-tab` and the panel `{id}-panel`.
    pub id: &'a str,
    /// Visible tab label.
    pub label: &'a str,
    /// Panel content.
    pub panel: Markup,
    /// Whether this tab is selected initially.
    pub selected: bool,
}

impl<'a> Tab<'a> {
    /// Creates an unselected tab.
    pub fn new(id: &'a str, label: &'a str, panel: Markup) -> Self {
        Self {
            id,
            label,
            panel,
            selected: false,
        }
    }

    /// Selects this tab.
    pub fn selected(mut self, selected: bool) -> Self {
        self.selected = selected;
        self
    }
}

/// Orientation of the tab list.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub enum TabsOrientation {
    #[default]
    Horizontal,
    Vertical,
}

impl TabsOrientation {
    /// The value written to `aria-orientation`.
    pub const fn as_str(self) -> &'static str {
        match self {
            Self::Horizontal => "horizontal",
            Self::Vertical => "vertical",
        }
    }
}

/// A tab list and its panels.
#[derive(Debug, Clone)]
pub struct Tabs<'a> {
    /// Base id for the widget.
    pub id: &'a str,
    /// Accessible name of the tab list.
    pub label: &'a str,
    /// The tabs. The first one is selected if none is.
    pub tabs: Vec<Tab<'a>>,
    /// Horizontal or vertical arrow-key navigation.
    pub orientation: TabsOrientation,
}

impl<'a> Tabs<'a> {
    /// Creates a horizontal tab list.
    pub fn new(id: &'a str, label: &'a str, tabs: Vec<Tab<'a>>) -> Self {
        Self {
            id,
            label,
            tabs,
            orientation: TabsOrientation::default(),
        }
    }

    /// Sets the orientation.
    pub fn orientation(mut self, orientation: TabsOrientation) -> Self {
        self.orientation = orientation;
        self
    }

    /// Renders the tab widget.
    pub fn render(&self) -> Markup {
        let active = self
            .tabs
            .iter()
            .position(|tab| tab.selected)
            .unwrap_or(0);

        html! {
            div
                class="ui-tabs"
                data-ui-tabs=(self.id)
                data-ui-tabs-orientation=(self.orientation.as_str())
            {
                div
                    class="ui-tabs__list"
                    role="tablist"
                    aria-label=(self.label)
                    aria-orientation=(self.orientation.as_str())
                {
                    @for (index, tab) in self.tabs.iter().enumerate() {
                        @let is_active = index == active;
                        @let aria_selected = if is_active { "true" } else { "false" };
                        @let tab_index = if is_active { "0" } else { "-1" };
                        button
                            type="button"
                            role="tab"
                            class="ui-tabs__tab"
                            id=(format!("{}-tab", tab.id))
                            aria-selected=(aria_selected)
                            aria-controls=(format!("{}-panel", tab.id))
                            tabindex=(tab_index)
                            data-ui-tab="true"
                        {
                            (tab.label)
                        }
                    }
                }
                @for (index, tab) in self.tabs.iter().enumerate() {
                    @let is_hidden = index != active;
                    section
                        class="ui-tabs__panel"
                        role="tabpanel"
                        id=(format!("{}-panel", tab.id))
                        aria-labelledby=(format!("{}-tab", tab.id))
                        tabindex="0"
                        hidden[is_hidden]
                    {
                        (tab.panel)
                    }
                }
            }
        }
    }
}
