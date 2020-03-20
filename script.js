import { ApplicationApi, ApplicationUI, EditorPlugin, 
	SidebarUI, UIRoot, MenuItemKind, MenuId, ListProgress,
	ListItemLayout, ListItemType, ImageArgs } from "prezi_plugin_api";

type VideoThumbnail = {

}

type UiState = {
	searchString: string
	resultList: VideoThumbnail[]
};

type VideoFile = {
	id: number
	quality: string
	file_type: string
	width: number
	height: number
	link: string
}

type Video = {
	url: string,
	image: string
	video_files: VideoFile[]
};

class Main implements EditorPlugin {
	init(applicationApi: ApplicationApi) {
		const uiRoot = applicationApi.declareUI<UiState>({
				searchString: "",
				resultList: []
			},
			(state, ui) => {
				this.createMenuItem(ui, state, uiRoot);
				this.createSidebar(ui, state, uiRoot);
			}
		);
		// open the sidebar automatically
		setTimeout(() => {uiRoot.sidebar.open("pexelsSidebar");}, 500);

	}

	createMenuItem(ui: ApplicationUI, state: UiState, uiRoot: UIRoot<UiState>) {
		ui.createMenuItem({
			kind: MenuItemKind.dropdown,
			id: "pexelsMenuItem",
			parent: MenuId.Lab,
			weight: 3,
			title: "Pexels Video",
			onClick: () => {
				uiRoot.sidebar.open("pexelsSidebar");
			},
		});
	}

	createSidebar(ui: ApplicationUI, state: UiState, uiRoot: UIRoot<UiState>) {
		return ui.createSidebar(sidebarUi => ({
			id: "pexelsSidebar",
			root: {
				title: "Insert Pexels Video",
				content: [
					this.createSearchField(sidebarUi, state, uiRoot),
					this.createResultList(sidebarUi, state, uiRoot)
				]
			}
		}));
	}

	createSearchField(sidebarUi: SidebarUI, state: UiState, uiRoot: UIRoot<UiState>) {
		return sidebarUi.searchField({
			id: "searchText",
			value: state.searchString,
			onValueChange: (ctx, value) => {
				uiRoot.setState({searchString: value});
			},
			onSearchButtonClick: (ctx) => {
				let encodedSearch = state.searchString;
				fetch(
					`https://api.pexels.com/videos/search?query=${encodedSearch}&per_page=15&page=1`,
					{
						headers: {
							Authorization: <API_CODE>
						}
					}
				).then(res => res.json()).then(json => {
					uiRoot.setState({ resultList: json.videos.map( (video:Video) => { 
						return {
							url: video.image,
							disabled: false,
							onClick: () => {/*...*/},
							hoverContent: {
								"type":"video",
								"url":video.video_files
									.filter(el => el.quality == "sd")
									.sort(el => el.height)[0]
									.link
								},
							info: {
								"url":"http://prezi.com",
								"icon":"icon-small-user",
								"text":"Luke Skywalker",
								"tooltip":"By Luke Skywalker"
							},
						}
						})
					});
				})
			}
		});
	}

	createResultList(sidebarUi: SidebarUI, state: UiState, uiRoot: UIRoot<UiState>) {
		return sidebarUi.simpleList(itemUi => ({
			items: state.resultList.map((video:ImageArgs) => itemUi.image(video)),
			itemLayout: ListItemLayout.fixed,
			itemType: ListItemType.large,
			showTitle: false,
			flexGrow: 1,
			progress: ListProgress.finished,
			activeId: null,
		}))
	}
}
