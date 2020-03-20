import { ApplicationApi, ApplicationUI, EditorPlugin, 
	SidebarUI, UIRoot, MenuItemKind,MenuId } from "prezi_plugin_api";

type UiState = {
	// Define the state of your plugin here
};

class Main implements EditorPlugin {
	init(applicationApi: ApplicationApi) {
		const uiRoot = applicationApi.declareUI<UiState>({
				// initial state comes here
			},
			(state, ui) => {
				this.createMenuItem(ui, state, uiRoot);
				this.createSidebar(ui, state, uiRoot);
			}
		);
		// open the sidebar automatically
		setTimeout(() => {uiRoot.sidebar.open("mySidebarId");}, 500);

	}

	createMenuItem(ui: ApplicationUI, state: UiState, uiRoot: UIRoot<UiState>) {
		ui.createMenuItem({
			kind: MenuItemKind.dropdown,
			id: "myMenuItem",
			parent: MenuId.Lab,
			weight: 3,
			title: "Open my sidebar",
			onClick: () => {
				uiRoot.sidebar.open("mySidebarId");
			},
		});
	}

	createSidebar(ui: ApplicationUI, state: UiState, uiRoot: UIRoot<UiState>) {
		return ui.createSidebar(sidebarUi => ({
			id: "mySidebarId",
			root: {
				title: "My sidebar",
				content: [
					this.createNameInput(sidebarUi, state, uiRoot),
				]
			}
		}));
	}

		createNameInput(sidebarUi: SidebarUI, state: UiState, uiRoot: UIRoot<UiState>) {
		return sidebarUi.inputField({
			id: "searchText",
			placeholderText: "Search...",
			value: "",
			onValueChange: (_, v) => {
				uiRoot.setState({name: v});
				return true;
			}
		});
	}
}
