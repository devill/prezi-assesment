import { ApplicationApi, ApplicationUI, EditorPlugin, 
	SidebarUI, UIRoot, MenuItemKind, MenuId, ListProgress,
	ListItemLayout, ListItemType, DroppableImageArgs, EditorSession } from "prezi_plugin_api";

type VideoThumbnail = {

}

type PexelsUser = {
	name: string
}

type UiState = {
	searchString: string
	resultList: VideoThumbnail[]
	progress: ListProgress
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
	user: PexelsUser
	video_files: VideoFile[]
};

class Main implements EditorPlugin {
	session: EditorSession

	init(applicationApi: ApplicationApi) {
		const uiRoot = applicationApi.declareUI<UiState>({
				searchString: "",
				resultList: [],
				progress: ListProgress.finished 
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
					sidebarUi.label("Videos by Pexel"),
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
				uiRoot.setState({ 
					resultList: [],
					progress: ListProgress.working
				});
				fetch(
					`https://api.pexels.com/videos/search?query=${encodedSearch}&per_page=15&page=1`,
					{
						headers: {
							Authorization: <API_KEY>
						}
					}
				).then(res => res.json()).then(json => {
					uiRoot.setState({ resultList: json.videos.map( (video:Video) => { 
						return {
							url: video.image,
							disabled: false,
							onDrop: (uat, info) => {
								return uat.doAsync(fetch(video.video_files[0].link).then( res => res.blob()), (aat, blob) => {
									if (aat.isValid()){
										this.session.document.executeApiCommand(aat, {
											name: "drop",
											run: pluginEditorApi => {
												blob.name = `filename.mp4`;
												const videoAsset = this.session.document.progressiveAssetManager.uploadVideo(blob).token;
												const parent = this.session.insertTarget.getSimpleObjectParent(pluginEditorApi);
												const imageEditor = parent.add.video(videoAsset);
											}
										});
									}
								});
							},
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
								"text":video.user.name,
								"tooltip":`By ${video.user.name} on pexels`
							},
						}
						}),
						progress: ListProgress.finished
					});
				})
			}
		});
	}

	createResultList(sidebarUi: SidebarUI, state: UiState, uiRoot: UIRoot<UiState>) {
		return sidebarUi.simpleList(itemUi => ({
			items: state.resultList.map((video:DroppableImageArgs) => itemUi.droppableImage(video)),
			itemLayout: ListItemLayout.fixed,
			itemType: ListItemType.large,
			showTitle: false,
			flexGrow: 1,
			progress: state.progress,
			activeId: null,
		}))
	}
}
