import { TranslationValue } from "../types";

export const ja: TranslationValue = {
  common: {
    status: {
      inProgress: "進行中",
      upcoming: "近日中",
      recent: "最近",
      active: "アクティブ",
      inactive: "非アクティブ",
      completed: "完了",
      scheduled: "予定済み",
      type: "タイプ"
    },
    loading: "読み込み中...",
    error: "エラー",
    success: "成功",
    cancel: "キャンセル",
    save: "保存",
    edit: "編集",
    delete: "削除",
    view: "表示",
    back: "戻る",
    next: "次へ",
    search: "検索",
    filter: "フィルター",
    all: "すべて",
    noResults: "結果が見つかりません",
    details: "詳細",
    actions: "アクション",
    viewDetails: "詳細を表示",
    addNew: "新規追加",
    backTo: "戻る",
    backToList: "一覧に戻る",
    saving: "保存中...",
    update: "更新",
    create: "作成",
    created: "作成済み",
    deleting: "削除中...",
    menu: "メニュー",
    login: "ログイン",
    logout: "ログアウト",
    darkMode: "ダークモード",
    inProgress: "進行中",
    upcoming: "近日中",
    recent: "最近",
    total: "合計",
    type: "タイプ",
    saveChanges: "変更を保存",
    confirmDelete: "削除の確認",
    untitled: "無題",
    grid: "グリッド",
    list: "リスト",
    submitting: "送信中...",
    notAssigned: "未割り当て",
    noImage: "画像なし",
    minutes: "分",
    call: "電話",
    text: "メッセージ",
    line: "LINE",
    exporting: "エクスポート中...",
    email: "メールアドレス",
    send: "メール送信",
    sending: "送信中...",
    selected: "選択済み",
    current: "現在",
    updated: "更新後",
    day: "日",
    week: "週",
    month: "月",
    today: "今日",
    booking: "予約",
    unassign: "割り当て解除"
  },
  navigation: {
    dashboard: "ダッシュボード",
    vehicles: "車両",
    drivers: "ドライバー",
    bookings: "予約",
    maintenance: "メンテナンス",
    inspections: "点検",
    settings: "設定",
    reporting: "レポート",
    dispatch: "配車ボード"
  },
  drivers: {
    title: "ドライバー",
    description: "ドライバー情報の管理",
    search: "ドライバーを検索...",
    filters: {
      status: "ステータス",
      all: "全てのドライバー",
      searchPlaceholder: "ドライバーを検索...",
      brand: "ステータスでフィルター",
      model: "タイプでフィルター",
      allBrands: "全てのステータス",
      allModels: "全てのタイプ",
      noResults: "結果が見つかりません",
      clearFilters: "フィルターをクリア"
    },
    actions: {
      addDriver: "ドライバーを追加",
      editDriver: "ドライバーを編集",
      updateDriver: "ドライバーを更新",
      viewDetails: "詳細を表示",
      deleteDriver: "ドライバーを削除",
      assignVehicle: "車両を割り当て",
      assignVehicleTo: "{name}に車両を割り当て",
      assignMultipleVehicles: "{count}台の車両を割り当て",
      unassignVehicle: "車両の割り当てを解除",
      unassignMultipleVehicles: "{count}台の車両の割り当てを解除",
      manageVehiclesFor: "{name}の車両を管理",
    },
    fields: {
      firstName: "名",
      lastName: "姓",
      email: "メールアドレス",
      phone: "電話番号",
      lineId: "LINE ID",
      licenseNumber: "免許証番号",
      licenseExpiry: "免許証期限",
      expires: "期限",
      status: "ステータス",
      address: "住所",
      emergencyContact: "緊急連絡先",
      notes: "備考"
    },
    placeholders: {
      firstName: "名を入力",
      lastName: "姓を入力",
      email: "メールアドレスを入力",
      phone: "電話番号を入力",
      lineId: "LINE IDを入力",
      licenseNumber: "免許証番号を入力",
      licenseExpiry: "期限日を選択",
      address: "住所を入力",
      emergencyContact: "緊急連絡先を入力",
      notes: "追加の備考を入力"
    },
    status: {
      active: "有効",
      inactive: "無効",
      on_leave: "休暇中",
      available: "利用可能",
      unavailable: "利用不可",
      leave: "休暇中",
      training: "研修中"
    },
    driverDetails: "ドライバー詳細",
    editDriver: {
      description: "ドライバー情報を更新する"
    },
    newDriver: {
      description: "新しいドライバーの情報を入力してください"
    },
    unassignVehicle: {
      selectedVehicles: "割り当て解除する選択された車両",
      noVehicles: "割り当てられた車両がありません",
      noVehiclesDescription: "このドライバーにはまだ車両が割り当てられていません。",
      confirm: "車両の割り当てを解除しますか？",
      confirmMultiple: "{count}台の車両の割り当てを解除しますか？",
      confirmDescription: "選択した車両のこのドライバーへの割り当てが解除されます。この操作は後で元に戻すことができます。",
    },
    assignVehicle: {
      description: "このドライバーに割り当てる車両を1台以上選択してください。",
      selectedVehicles: "選択された車両"
    },
    manageVehicles: {
      description: "このドライバーに新しい車両を割り当てるか、既存の車両の割り当てを解除します。"
    },
    empty: {
      title: "ドライバーが見つかりません",
      description: "まだドライバーが追加されていません。新しいドライバーを追加して始めましょう。",
      searchResults: "検索条件に一致するドライバーがありません。検索条件を変更してみてください。"
    },
    messages: {
      createSuccess: "ドライバーが正常に作成されました",
      createSuccessDescription: "ドライバーが作成され、システムで利用可能になりました。",
      updateSuccess: "ドライバーが正常に更新されました",
      updateSuccessDescription: "ドライバーの詳細が更新されました。",
      deleteSuccess: "ドライバーが正常に削除されました",
      createError: "ドライバーの作成中にエラーが発生しました",
      createErrorDescription: "ドライバーの作成に問題がありました。もう一度お試しください。",
      updateError: "ドライバーの更新中にエラーが発生しました",
      updateErrorDescription: "ドライバーの詳細の更新に問題がありました。もう一度お試しください。",
      deleteError: "ドライバーの削除中にエラーが発生しました",
      loadError: "ドライバーの読み込み中にエラーが発生しました",
      loadErrorDescription: "ドライバーの詳細を読み込めませんでした。もう一度お試しください。",
      assignSuccess: "車両が正常に割り当てられました",
      assignSuccessDescription: "車両がこのドライバーに割り当てられました。",
      multipleAssignSuccessDescription: "{count}台の車両がこのドライバーに割り当てられました。",
      assignError: "車両の割り当て中にエラーが発生しました",
      assignErrorDescription: "車両の割り当てに問題がありました。もう一度お試しください。",
      unassignSuccess: "車両の割り当てが正常に解除されました",
      unassignSuccessDescription: "車両の割り当てがこのドライバーから解除されました。",
      multipleUnassignSuccessDescription: "{count}台の車両の割り当てがこのドライバーから解除されました。",
      unassignError: "車両の割り当て解除中にエラーが発生しました",
      unassignErrorDescription: "車両の割り当て解除に問題がありました。もう一度お試しください。",
      noVehicleSelected: "車両が選択されていません",
      noVehicleSelectedDescription: "このドライバーに割り当てる車両を選択してください。",
      noVehicleSelectedToUnassign: "このドライバーから割り当てを解除する車両を選択してください。",
    },
    assignedVehicles: {
      title: "割り当て車両",
      description: "このドライバーに割り当てられた車両",
      count: "{count}台の車両",
      noVehicles: "割り当てられた車両がありません"
    },
    recentActivity: {
      title: "最近のアクティビティ",
      description: "このドライバーの最近のアクティビティ",
      empty: {
        title: "最近のアクティビティがありません",
        description: "このドライバーには最近のアクティビティがありません"
      }
    },
    upcomingBookings: {
      title: "予定された予約",
      description: "このドライバーの予定された予約",
      empty: {
        title: "予定された予約がありません",
        description: "このドライバーには予定された予約がありません。",
        message: "予定された予約はありません"
      },
      booking: "予約",
      unassign: "割り当て解除",
      unassignSuccess: "予約の割り当てを解除しました",
      unassignSuccessDescription: "この予約はドライバーから削除されました。",
      unassignError: "予約の割り当て解除に失敗しました"
    },
    activityHistory: {
      title: "アクティビティ履歴",
      description: "ドライバーの活動記録",
      empty: {
        title: "履歴が見つかりません",
        description: "このドライバーのアクティビティ履歴はありません"
      }
    },
    activity: {
      title: "ドライバーアクティビティ",
      empty: {
        title: "アクティビティが見つかりません",
        description: "このドライバーには記録されたアクティビティがまだありません"
      }
    },
    notFound: {
      title: "ドライバーが見つかりません",
      description: "指定されたドライバーは存在しないか、削除されました"
    },
    tabs: {
      overview: "概要",
      activity: "活動履歴",
      inspections: "点検履歴",
      availability: "稼働状況",
      assignVehicles: "新規割り当て",
      unassignVehicles: "割り当て解除"
    },
    vehicles: {
      title: "関連車両",
      description: "このドライバーに割り当てられた車両",
      noVehicles: "このドライバーに割り当てられた車両はありません",
      noAvailable: "利用可能な車両がありません",
      noAvailableDescription: "選択可能な車両がありません。"
    },
    inspections: {
      title: "ドライバー点検",
      description: "このドライバーの点検履歴を表示",
      noInspections: "点検記録が見つかりません",
      viewInspection: "点検を表示",
      empty: {
        title: "点検記録なし",
        description: "このドライバーにはまだ点検記録がありません。"
      },
      inspectionDate: "点検日",
      inspectionType: "点検タイプ",
      status: "状態"
    },
    since: "{date}からのドライバー",
    availability: {
      title: "ドライバーの予定",
      currentStatus: "現在のステータス",
      upcomingSchedule: "今後の予定",
      viewFullSchedule: "全予定を見る",
      noUpcomingSchedule: "予定変更はありません",
      availableMessage: "このドライバーは現在予約の割り当てが可能です。",
      returnMessage: "このドライバーは{date}に業務復帰予定です。",
      statusMessage: "このドライバーは{date}まで{status}です。",
      onBookingMessage: "このドライバーは現在予約中で、{endTime}まで利用できません。",
      calendarView: "カレンダー表示",
      listView: {
        title: "リスト表示",
        empty: "表示する稼働記録がありません。",
        loading: "読み込み中...",
        addAvailability: "稼働状況を追加",
        editAvailability: "稼働状況を編集",
        deleteConfirmTitle: "よろしいですか？",
        deleteConfirmMessage: "この操作は元に戻せません。稼働記録が完全に削除されます。",
        deleteSuccess: "稼働状況を削除しました",
        deleteSuccessMessage: "ドライバーの稼働状況が正常に削除されました",
        deleteError: "稼働状況の削除に失敗しました",
        loadError: "稼働状況の読み込みに失敗しました",
        editDisabledTooltip: "予約に関連した稼働状況は編集できません",
        deleteDisabledTooltip: "予約に関連した稼働状況は削除できません"
      },
      loading: "読み込み中...",
      setAvailability: "稼働状況を設定",
      setAvailabilityFor: "{date}の稼働状況を設定",
      statuses: {
        available: "利用可能",
        unavailable: "利用不可",
        leave: "休暇中",
        sick: "病欠",
        training: "研修中"
      },
      form: {
        startDate: "開始日",
        endDate: "終了日",
        status: "ステータス",
        notes: "備考",
        createSuccess: "稼働状態を追加しました",
        updateSuccess: "稼働状態を更新しました",
        deleteSuccess: "稼働状態を削除しました",
        createError: "稼働状態の追加に失敗しました",
        updateError: "稼働状態の更新に失敗しました",
        deleteError: "稼働状態の削除に失敗しました",
        description: "このドライバーの稼働期間を管理します。利用可能、休暇中、研修中などの状態を設定します。"
      }
    },
    details: {
      title: "点検詳細",
      description: "点検に関する詳細情報",
      noItems: "点検項目が見つかりません",
      empty: {
        title: "点検詳細なし",
        description: "この点検には詳細情報がありません。"
      },
      tabs: {
        details: "詳細",
        failed: "不合格",
        passed: "合格"
      },
      sections: {
        vehicle: "車両情報",
        inspection: "点検情報",
        summary: "概要",
        items: "点検項目",
        failed: "不合格項目",
        passed: "合格項目"
      },
      actions: {
        print: "レポート印刷",
        export: "レポートエクスポート",
        exportResult: "結果をエクスポート"
      },
    },
  },
  labels: {
    due: "{date}まで",
    priority: {
      high: "高",
      medium: "中",
      low: "低"
    },
    status: {
      scheduled: "予定",
      inProgress: "進行中"
    }
  },
  settings: {
    title: "設定",
    description: "アカウント設定と環境設定を管理する",
    selectTab: "設定タブを選択",
    profile: {
      title: "プロフィール",
      description: "プロフィール情報を管理する",
      name: "名前",
      email: "メールアドレス",
      emailDescription: "メールアドレスはログインと通知に使用されます。"
    },
    preferences: {
      title: "環境設定",
      description: "アプリケーション体験をカスタマイズする",
      theme: {
        title: "テーマ",
        light: "ライト",
        dark: "ダーク",
        system: "システム"
      },
      language: {
        title: "言語",
        en: "英語",
        ja: "日本語"
      }
    },
    menu: {
      title: "メニュー設定",
      description: "ナビゲーションに表示するメニュー項目をカスタマイズする",
      menuItem: "メニュー項目",
      desktop: "デスクトップ",
      mobile: "モバイル",
      desktopSettingsHidden: "デスクトップ設定は大きな画面でのみ表示されます。",
      alwaysVisible: "常に表示",
      dashboard: "ダッシュボード",
      vehicles: "車両",
      drivers: "ドライバー",
      bookings: "予約",
      maintenance: "メンテナンス",
      inspections: "点検",
      reporting: "レポート",
      settings: "設定",
      save: "変更を保存"
    },
    templates: {
      title: "点検テンプレート",
      description: "点検フォーム（セクションと項目）の構造を管理します。"
    },
    tabs: {
      profile: "プロフィール",
      preferences: "環境設定",
      menu: "メニュー",
      templates: "テンプレート",
      account: "アカウント"
    },
    selectTemplate: "テンプレートタイプを選択",
    inspectionTypes: {
      routine: "定期点検",
      safety: "安全点検",
      maintenance: "メンテナンス点検",
      select: "点検タイプを選択",
      description: {
        routine: "車両コンポーネントの定期的な点検",
        safety: "包括的な安全システム評価",
        maintenance: "詳細な機械システム点検"
      }
    }
  },
  vehicles: {
    title: "車両",
    description: "車両フリートを管理する",
    addVehicle: "車両を追加",
    newVehicle: "新しい車両",
    editVehicle: "車両を編集",
    details: "車両詳細",
    searchPlaceholder: "車両を検索...",
    noVehicles: "車両が見つかりません",
    noAvailable: "利用可能な車両がありません",
    noAvailableDescription: "選択可能な車両がありません。",
    status: {
      active: "稼働中",
      maintenance: "メンテナンス中",
      inactive: "非稼働"
    },
    filters: {
      search: "車両を検索",
      searchPlaceholder: "名前またはナンバープレートで検索",
      brand: "メーカーでフィルター",
      model: "モデルでフィルター",
      allBrands: "全メーカー",
      allModels: "全モデル",
      noResults: "検索条件に一致する車両はありません",
      clearFilters: "フィルターをクリア"
    },
    pagination: {
      showing: "{total}台中{start}-{end}台を表示",
      loadMore: "もっと読み込む",
      page: "ページ {page}",
      of: "/ {total}"
    },
    fields: {
      name: "車両名",
      nameDescription: "この車両を識別するための名前",
      namePlaceholder: "例：家族用SUV",
      plateNumber: "ナンバープレート",
      brand: "メーカー",
      brandDescription: "車両の製造元",
      brandPlaceholder: "例：トヨタ",
      model: "モデル",
      modelPlaceholder: "例：カムリ",
      year: "年式",
      yearPlaceholder: "例：2024",
      vin: "VIN",
      vinDescription: "17文字の車両識別番号",
      status: "ステータス",
      statusDescription: "車両の現在の運用状態",
      image: "車両画像",
      imageDescription: "PNG、JPG、またはWEBP（最大800x400px）",
      modelDescription: "車両のモデル名",
      yearDescription: "製造年",
      plateNumberDescription: "車両登録番号",
      plateNumberPlaceholder: "例：品川300あ1234",
      statusPlaceholder: "車両のステータスを選択",
      statusActive: "稼働中",
      statusInactive: "非稼働",
      statusMaintenance: "メンテナンス中",
      uploadImage: "画像をアップロード",
      formCompletion: "フォーム完了",
      formCompletionDescription: "必須フィールドの進捗",
      vinPlaceholder: "17文字のVINを入力",
      uploadImageButton: "画像をアップロード",
      uploadImageDragText: "ここに画像をドラッグ＆ドロップするか、クリックして選択",
      uploadImageSizeLimit: "最大ファイルサイズ：5MB",
      type: "車両タイプ"
    },
    form: {
      basicInfo: "基本情報",
      additionalInfo: "追加情報"
    },
    tabs: {
      info: "情報",
      schedule: "予定",
      inProgress: "進行中",
      history: "履歴",
      costs: "コスト",
      reminders: "リマインダー",
      scheduleEmpty: "予定されたタスクはありません",
      historyEmpty: "履歴はありません",
      costsEmpty: "コスト記録はありません",
      remindersEmpty: "リマインダーは設定されていません",
      upcomingMaintenance: "今後のメンテナンス",
      scheduledInspections: "予定された点検",
      addMaintenanceTask: "タスクを追加",
      scheduleInspection: "点検を予定",
      maintenanceHistory: "メンテナンス履歴",
      inspectionHistory: "点検履歴",
      completedOn: "{date}に完了",
      totalCosts: "総コスト",
      maintenanceCosts: "メンテナンスコスト",
      fuelCosts: "燃料コスト",
      otherCosts: "その他のコスト",
      addReminder: "リマインダーを追加",
      noReminders: "この車両にはリマインダーが設定されていません"
    },
    messages: {
      createSuccess: "車両が正常に作成されました",
      updateSuccess: "車両が正常に更新されました",
      deleteSuccess: "車両が正常に削除されました",
      error: "エラーが発生しました",
      deleteError: "車両を削除できません",
      hasAssociatedRecords: "この車両には関連する点検またはメンテナンスタスクがあり、削除できません",
      imageUploadError: "画像のアップロードに失敗しました"
    },
    addNewTitle: "新しい車両を追加",
    addNewDescription: "フリートに新しい車両を追加する",
    vehicleInformation: "車両情報",
    vehicleDetails: "車両詳細",
    vehicleStatus: "車両ステータス",
    edit: {
      title: "車両を編集",
      description: "車両情報を更新する"
    },
    delete: {
      title: "車両を削除",
      description: "この操作は元に戻せません。車両は完全に削除され、サーバーから削除されます。"
    },
    schedule: {
      title: "今後のタスク",
      maintenanceTitle: "予定されたメンテナンス",
      inspectionsTitle: "予定された点検",
      noUpcoming: "予定されているタスクはありません",
      noMaintenanceTasks: "予定されているメンテナンスタスクはありません",
      noInspections: "予定されている点検はありません",
    },
    history: {
      title: "車両履歴",
      maintenanceTitle: "完了したメンテナンス",
      inspectionTitle: "完了した点検",
      noRecords: "履歴記録が見つかりません",
      noMaintenanceRecords: "完了したメンテナンス記録はありません",
      noInspectionRecords: "完了した点検記録はありません",
      inspection: "点検",
      maintenance: "メンテナンス",
    },
    inProgress: {
      title: "進行中のタスク",
      maintenanceTitle: "進行中のメンテナンス",
      inspectionsTitle: "進行中の点検",
      noTasks: "進行中のタスクはありません",
      noMaintenanceTasks: "進行中のメンテナンスタスクはありません",
      noInspections: "進行中の点検はありません",
    },
    deleteDialog: {
      title: "車両を削除しますか？",
      description: "この操作は元に戻せません。車両は完全に削除され、サーバーから削除されます。"
    },
    placeholders: {
      name: "車両名を入力",
      plateNumber: "ナンバープレートを入力",
      brand: "メーカーを入力",
      model: "モデルを入力",
      year: "製造年を入力",
      vin: "車両識別番号を入力"
    },
    allVehicles: "すべての車両"
  },
  maintenance: {
    title: "メンテナンス",
    description: "車両のメンテナンスタスクを管理する",
    scheduleTask: "メンテナンスをスケジュール",
    searchPlaceholder: "メンテナンスタスクを検索...",
    noTasks: "メンテナンスタスクが見つかりません",
    noTasksTitle: "メンテナンスタスクなし",
    addTask: "タスクを追加",
    newTask: "新しいメンテナンスタスク",
    editTask: "メンテナンスタスクを編集",
    createImmediateTask: "即時タスクを作成",
    createImmediateTaskDescription: "定期的なスケジュールに加えて、すぐにタスクを作成する",
    recurringTask: "定期的なタスク",
    oneTime: "一回限りのタスク",
    isRecurring: "これを定期的なメンテナンスにする",
    isRecurringDescription: "このメンテナンスを定期的な間隔で繰り返すようにスケジュールする",
    schedule: {
      title: "メンテナンスを予定",
      details: "新しいメンテナンスタスクを予定",
      description: "車両のメンテナンスタスクを作成",
      button: "予定する",
      id: "スケジュールID"
    },
    createDirect: "タスクを作成",
    status: {
      pending: "保留中",
      scheduled: "予定済み",
      in_progress: "進行中",
      completed: "完了",
      cancelled: "キャンセル"
    },
    priority: {
      title: "優先度",
      high: "高",
      medium: "中",
      low: "低"
    },
    templates: {
      selectTemplate: "タスクテンプレートを選択",
      searchPlaceholder: "テンプレートを検索...",
      noResults: "テンプレートが見つかりません",
      createCustomTask: "カスタムタスクを作成",
      useTemplate: "テンプレートを使用",
      manualEntry: "手動入力",
      templateInfo: "クイックタスク作成",
      templateInfoDescription: "事前定義されたタスクテンプレートを選択して、標準的な所要時間とコストを持つ一般的なメンテナンスタスクをすばやく入力できます。",
      templateApplied: "テンプレートが適用されました",
      templateAppliedDescription: "テンプレートが適用されました。必要に応じてタスクの詳細をカスタマイズできます。"
    },
    form: {
      description: "以下のフォームに入力して、新しいメンテナンスタスクを作成します",
      basicInfo: "基本情報",
      scheduleInfo: "スケジュール",
      additionalDetails: "詳細",
      stepOneTitle: "基本情報を入力",
      stepOneDescription: "テンプレートを選択（任意）し、基本的なタスク情報を入力します。",
      stepTwoTitle: "スケジュールを設定",
      stepTwoDescription: "このタスクを繰り返す頻度と開始時期を定義します。",
      stepThreeTitle: "追加詳細を入力",
      stepThreeDescription: "このメンテナンスタスクに関する追加情報を提供します。"
    },
    fields: {
      title: "タスク名",
      titlePlaceholder: "例：オイル交換",
      titleDescription: "メンテナンスタスクの名前",
      description: "説明",
      descriptionPlaceholder: "例：定期的なオイル交換とフィルター交換",
      descriptionDescription: "メンテナンスタスクの詳細な説明",
      vehicle: "車両",
      vehicleDescription: "このメンテナンスタスクの対象車両を選択",
      dueDate: "期日",
      dueDateDescription: "このタスクを完了すべき日",
      priority: "優先度",
      priorityDescription: "タスクの優先度レベル",
      status: "ステータス",
      statusDescription: "タスクの現在の状態",
      estimatedDuration: "予想所要時間（時間）",
      estimatedDurationPlaceholder: "例：2",
      estimatedDurationDescription: "タスク完了までの予想時間（時間単位）",
      cost: "予想コスト",
      costDescription: "メンテナンスの予想コスト",
      estimatedCost: "予想コスト",
      estimatedCostPlaceholder: "例：15000",
      estimatedCostDescription: "このメンテナンスタスクの予想コスト",
      selectVehicle: "車両を選択",
      selectVehiclePlaceholder: "車両を選択してください",
      notes: "追加メモ",
      notesPlaceholder: "追加の注意事項や要件を入力",
      notesDescription: "メンテナンスタスクに関する追加情報",
      dueDatePlaceholder: "日付を選択",
    },
    details: {
      taskDetails: "タスクの詳細",
      vehicleDetails: "車両の詳細",
      vehicleInfo: {
        noImage: "画像なし"
      },
      scheduledFor: "{date}予定",
      estimatedCompletion: "予想完了時間: {duration}時間",
      estimatedCost: "予想費用: {cost}",
      assignedVehicle: "割り当て車両",
      taskHistory: "タスク履歴",
      noHistory: "履歴はありません",
      taskProgress: "タスクの進捗",
      hours: "時間",
      overdueDays: "{days}日遅延",
      daysUntilDue: "期限まであと{days}日",
      recommendations: "メンテナンスの推奨事項",
      recommendationItems: {
        checkRelated: "関連システムの確認",
        checkRelatedDesc: "このメンテナンス作業中に関連する車両システムの点検を検討してください。",
        trackCosts: "メンテナンスコストの追跡",
        trackCostsDesc: "将来の参考のために、このメンテナンスに関連するすべてのコストを記録してください。"
      },
      progressStatus: {
        completed: "このタスクは完了しました。",
        inProgress: "このタスクは現在進行中です。",
        scheduled: "このタスクは予定されており、保留中です。",
        overdue: "このタスクは期限切れで、注意が必要です。"
      }
    },
    messages: {
      createSuccess: "メンテナンスタスクが正常に作成されました",
      updateSuccess: "メンテナンスタスクが正常に更新されました",
      deleteSuccess: "メンテナンスタスクが正常に削除されました",
      taskStarted: "メンテナンスタスクが開始されました",
      error: "エラーが発生しました",
      immediateTaskError: "即時タスクの作成中にエラーが発生しました",
      nextTaskCreated: "次の定期タスクが作成されました",
      nextTaskScheduled: "次のタスクは{date}に予定されています"
    },
    actions: {
      markComplete: "完了としてマーク",
      markInProgress: "進行中としてマーク",
      startTask: "タスクを開始",
      cancel: "タスクをキャンセル",
      edit: "タスクを編集",
      delete: "タスクを削除"
    },
  },
  inspections: {
    title: "点検",
    description: "車両点検の管理",
    addInspection: "点検を追加",
    newInspection: "新規点検",
    editInspection: "点検を編集",
    searchPlaceholder: "点検を検索...",
    noInspections: "点検が見つかりません",
    createInspection: "点検を作成",
    defaultType: "定期点検",
    status: {
      scheduled: "予定済み",
      in_progress: "進行中",
      pending: "保留中",
      completed: "完了",
      cancelled: "キャンセル済み"
    },
    tabs: {
      list: "リスト",
      stats: "統計"
    },
    groupBy: "グループ化",
    groupByOptions: {
      none: "グループ化なし", 
      date: "日付別",
      vehicle: "車両別"
    },
    gro: "日付別",
    labels: {
      progress: "点検の進捗",
      estimatedTime: "推定残り時間",
      model: "モデル",
      photoNumber: "写真 {{number}}"
    },
    actions: {
      pass: "合格",
      fail: "不合格",
      complete: "点検を完了",
      markComplete: "完了としてマーク",
      markInProgress: "点検を開始",
      startInspection: "点検を開始",
      cancel: "点検をキャンセル",
      edit: "点検を編集",
      delete: "点検を削除",
      addPhoto: "写真を追加",
      addNotes: "メモを追加",
      resume: "点検を再開",
      scheduleRepair: "修理を予定",
      needsRepair: "修理が必要",
      scheduleRepairDescription: "車両を最適な状態に保つため、不合格項目の修理メンテナンスタスクを予定します。",
      takePhoto: "写真を撮る",
      photos: "写真 ({{count}}枚)",
      previousSection: "前のセクション",
      nextSection: "次のセクション",
      completeInspection: "点検を完了"
    },
    noGrouping: "グループ化なし",
    allVehicles: "すべての車両",
    resultsCount: "{count}件の結果",
    noVehicle: "車両未割り当て",
    selectVehiclePrompt: "表示する車両を選択してください",
    dateGroup: {
      today: "今日",
      yesterday: "昨日",
      thisWeek: "今週",
      thisMonth: "今月",
      upcoming: "今後",
      older: "過去",
      unknown: "不明な日付"
    },
    stats: {
      totalInspections: "総点検数",
      completed: "完了済み",
      scheduled: "予定済み",
      byVehicle: "車両別点検数",
      byType: "タイプ別点検数",
      count: "{count} 件の点検",
      vehicleCount: "{count} 台の車両"
    },
    pagination: {
      showing: "{total}台中{start}-{end}台を表示",
      page: "ページ {page}",
      of: "/ {total}"
    }
  },
  dashboard: {
    title: "ダッシュボード",
    description: "車両フリートの概要",
    quickActions: {
      title: "クイックアクション",
      description: "一般的なタスクとアクション",
      addVehicle: "車両を追加",
      scheduleMaintenance: "メンテナンスを予定",
      scheduleInspection: "点検を作成",
      viewReports: "レポートを表示"
    },
    activityFeed: {
      title: "アクティビティフィード",
      description: "最近および今後のアクティビティ",
      noUpcoming: "今後のアクティビティはありません",
      noRecent: "最近のアクティビティはありません",
      viewAll: "すべて表示"
    },
    dailyChecklist: {
      title: "日次チェックリスト",
      description: "今日完了するタスク",
      completeChecklist: "チェックリストを完了",
      checkAllItems: "すべての項目をチェックして完了",
      upcomingReminders: "今後のリマインダー",
      completed: {
        title: "チェックリスト完了！",
        message: "お疲れ様でした！日次チェックがすべて完了しました。また明日！",
        reset: "チェックリストをリセット"
      },
      items: {
        checkTires: "タイヤの空気圧と状態を確認",
        checkLights: "すべてのライトが機能していることを確認",
        checkFluids: "オイルと冷却水のレベルを確認",
        checkBrakes: "ブレーキとパーキングブレーキをテスト",
        visualInspection: "目視検査を実施"
      }
    },
    upcomingBookings: {
      title: "今後の予約",
      description: "レビューと割り当て待ちの予約",
      viewAll: "すべての予約を表示",
      empty: {
        title: "今後の予約はありません",
        description: "レビューまたは割り当て待ちの予約はありません。",
        message: "今後の予約はありません"
      }
    },
    vehicleStats: {
      title: "車両概要",
      description: "車両の簡単な統計",
      fuelLevel: "燃料レベル",
      mileage: "走行距離",
      viewAllVehicles: "すべての車両を表示"
    },
    maintenance: {
      title: "メンテナンス",
      description: "今後および最近のメンテナンスタスク"
    },
    inspections: {
      title: "点検",
      description: "今後および最近の点検"
    },
    stats: {
      totalVehicles: "車両総数",
      maintenanceTasks: "メンテナンスタスク",
      inspections: "点検",
      activeVehicles: "稼働中の車両"
    },
    sections: {
      maintenanceSchedule: {
        title: "メンテナンススケジュール",
        noPending: "保留中のメンテナンスタスクはありません"
      },
      inspectionSchedule: {
        title: "点検スケジュール",
        noPending: "保留中の点検はありません"
      },
      recentMaintenance: {
        title: "最近のメンテナンス",
        noCompleted: "完了したメンテナンスタスクはありません"
      },
      recentInspections: {
        title: "最近の点検",
        noCompleted: "完了した点検はありません"
      }
    }
  },
  fuel: {
    title: "燃料ログ",
    description: "燃料補給の記録を管理",
    new: {
      title: "新規燃料ログ",
      description: "新しい燃料補給を記録"
    },
    edit: {
      title: "燃料ログを編集",
      description: "燃料補給の記録を編集"
    },
    fields: {
      date: "日付",
      odometer_reading: "走行距離",
      fuel_amount: "給油量",
      fuel_cost: "費用",
      fuel_type: "燃料タイプ",
      station_name: "給油所",
      full_tank: "満タン給油",
      notes: "メモ"
    },
    messages: {
      created: "燃料ログを作成しました",
      updated: "燃料ログを更新しました",
      deleted: "燃料ログを削除しました",
      error: "エラーが発生しました"
    },
    noData: "燃料ログデータがありません"
  },
  mileage: {
    title: "走行距離ログ",
    description: "走行距離の記録を管理",
    new: {
      title: "新規走行距離ログ",
      description: "新しい走行距離を記録"
    },
    edit: {
      title: "走行距離ログを編集",
      description: "走行距離の記録を編集"
    },
    fields: {
      date: "日付",
      start_odometer: "開始時の走行距離",
      end_odometer: "終了時の走行距離",
      distance: "走行距離",
      purpose: "目的",
      notes: "メモ"
    },
    messages: {
      created: "走行距離ログを作成しました",
      updated: "走行距離ログを更新しました",
      deleted: "走行距離ログを削除しました",
      error: "エラーが発生しました"
    }
  },
  reporting: {
    title: "レポート & 分析",
    description: "車両管理の詳細なレポートと分析を表示します。",
    filters: {
      vehicleType: "車両タイプ",
      status: "ステータス",
      apply: "フィルター適用",
      reset: "リセット",
    },
    export: {
      title: "エクスポート",
      pdf: "PDFとしてエクスポート",
      excel: "Excelとしてエクスポート",
    },
    fromPreviousPeriod: "前期間比",
    sections: {
      overview: "概要",
      analytics: "分析",
      reports: {
        title: "レポート",
        maintenance: "メンテナンス履歴レポート",
        maintenanceDescription: "各車両の詳細なメンテナンス記録",
        fuel: "燃費レポート",
        fuelDescription: "燃料消費と効率の分析",
        cost: "コスト分析レポート",
        costDescription: "全車両関連コストの詳細な内訳",
        downloadCSV: "CSVをダウンロード",
        downloadPDF: "PDFをダウンロード",
        customReport: "カスタムレポート",
        customReportDescription: "複数のソースからデータを組み合わせて単一のレポートを作成",
        recentReports: "最近のレポート",
        createCustomReport: "カスタムレポートを作成",
        generateReport: "レポートを生成",
        reportName: "レポート名",
        reportType: "レポートタイプ",
        includeData: "データを含める",
        vehicleInformation: "車両情報",
        maintenanceData: "メンテナンスデータ",
        fuelData: "燃料データ",
        costAnalysis: "コスト分析",
        cancel: "キャンセル"
      },
      fleetOverview: {
        title: "車両概要",
        totalVehicles: "総車両数",
        activeVehicles: "稼働中の車両",
        inMaintenance: "メンテナンス中",
        inactive: "非稼働",
      },
      maintenanceMetrics: {
        title: "メンテナンス指標",
        totalTasks: "総タスク数",
        completedTasks: "完了タスク",
        averageCompletionTime: "平均完了時間（日）",
        upcomingTasks: "予定タスク",
        tasksByPriority: "優先度別タスク",
        tasksByStatus: "状態別タスク",
        costOverTime: "メンテナンスコストの推移",
        totalCost: "総メンテナンスコスト",
        scheduledCost: "計画メンテナンス",
        unscheduledCost: "緊急メンテナンス"
      },
      inspectionMetrics: {
        title: "点検指標",
        totalInspections: "総点検数",
        passRate: "合格率",
        failRate: "不合格率",
        commonFailures: "一般的な不具合",
        inspectionsByStatus: "状態別点検",
      },
      vehicleUtilization: {
        title: "車両稼働率",
        maintenanceCostPerVehicle: "車両別メンテナンスコスト",
        inspectionPassRateByVehicle: "車両別点検合格率",
        vehicleStatus: "車両状態分布",
      },
      vehiclePerformance: {
        title: "車両パフォーマンス",
        description: "各車両のパフォーマンス指標",
        vehicle: "車両",
        utilization: "稼働率",
        distance: "走行距離 (km)",
        fuelUsed: "燃料使用量 (L)",
        efficiency: "燃費 (km/L)",
        costPerKm: "1km当たりのコスト",
        noData: "選択期間のパフォーマンスデータがありません",
        search: "車両を検索...",
        filterByBrand: "ブランドでフィルター",
        allBrands: "すべてのブランド",
        noVehiclesFound: "条件に一致する車両が見つかりません",
        scheduled: "計画メンテナンス",
        unscheduled: "緊急メンテナンス",
        consumption: "消費量",
        maintenance: "メンテナンス",
        fuel: "燃料"
      },
      costPerKm: {
        title: "1キロメートルあたりのコスト",
        description: "車両ごとのメンテナンスと燃料の1キロメートルあたりのコスト"
      },
      fuelConsumption: {
        title: "燃料消費傾向",
        description: "車両タイプ別の月間燃料消費量",
        noData: "選択期間の燃料消費データがありません"
      },
      monthlyMileage: {
        title: "月間走行距離傾向",
        description: "車両タイプ別の月間走行距離",
        noData: "選択期間の走行距離データがありません"
      },
      maintenanceFrequency: {
        title: "メンテナンス頻度",
        description: "計画・緊急メンテナンスの頻度"
      },
      vehicleAvailability: {
        title: "車両稼働状況",
        description: "車両の稼働時間とメンテナンス期間"
      },
      maintenanceCosts: {
        title: "メンテナンスコスト分布",
        range: "コスト範囲",
        count: "タスク数",
        total: "総コスト",
        average: "平均コスト"
      }
    },
    noData: "選択したフィルターに該当するデータがありません",
  },
  notifications: {
    title: "通知",
    empty: "通知はありません",
    toggle: "通知の切り替え",
    delete: "通知を削除",
    deleteSuccess: "通知を削除しました",
    deleteError: "通知の削除に失敗しました",
    markAllAsRead: "すべて既読にする",
    markAsRead: "既読にする",
    markAsReadSuccess: "既読にしました",
    markAsReadError: "既読にできませんでした",
    upcoming: "今後",
    today: "今日",
    thisWeek: "今週",
    newNotifications: "{count}件の新しい通知",
    clickToView: "クリックして表示",
    unread: "未読{count}件"
  },
  schedules: {
    title: "スケジュール",
    createSchedule: "スケジュール作成",
    frequency: "頻度",
    selectFrequency: "頻度を選択",
    frequencyDescription: "このタスクを実行する頻度",
    intervalDays: "間隔（日）",
    intervalDaysPlaceholder: "日数を入力",
    intervalDaysDescription: "各発生の間の日数",
    startDate: "開始日",
    startDateDescription: "タスク生成を開始する日",
    endDate: "終了日（任意）",
    endDatePlaceholder: "終了日なし",
    endDateDescription: "タスク生成を停止する日",
    selectDate: "日付を選択",
    frequencies: {
      daily: "毎日",
      weekly: "毎週",
      biweekly: "隔週",
      monthly: "毎月",
      quarterly: "四半期ごと",
      biannually: "半年ごと",
      annually: "毎年",
      custom: "カスタム"
    },
    maintenance: {
      title: "定期メンテナンスのスケジュール",
      description: "指定した頻度で自動的にスケジュールされる定期メンテナンスタスクを設定する",
      createSuccess: "メンテナンススケジュールが正常に作成されました",
      createError: "メンテナンススケジュールの作成に失敗しました",
      updateSuccess: "メンテナンススケジュールが正常に更新されました",
      updateError: "メンテナンススケジュールの更新に失敗しました",
      deleteSuccess: "メンテナンススケジュールが正常に削除されました",
      deleteError: "メンテナンススケジュールの削除に失敗しました"
    },
    inspection: {
      title: "定期点検のスケジュール",
      description: "指定した頻度で自動的にスケジュールされる定期点検を設定する",
      createSuccess: "点検スケジュールが正常に作成されました",
      createError: "点検スケジュールの作成に失敗しました",
      updateSuccess: "点検スケジュールが正常に更新されました",
      updateError: "点検スケジュールの更新に失敗しました",
      deleteSuccess: "点検スケジュールが正常に削除されました",
      deleteError: "点検スケジュールの削除に失敗しました"
    }
  },
  auth: {
    login: "ログイン",
    logout: "ログアウト",
    email: "メールアドレス",
    password: "パスワード",
    forgotPassword: "パスワードをお忘れですか",
    resetPassword: "パスワードをリセット",
    register: "登録",
    loginSuccess: "ログインに成功しました",
    loginError: "ログインに失敗しました",
    logoutSuccess: "ログアウトに成功しました"
  },
  bookings: {
    title: "予約",
    description: "車両の予約を表示・管理する",
    search: {
      text: "予約を検索...",
      placeholder: "予約を検索..."
    },
    addBooking: "新規予約",
    newBooking: "新規予約",
    editBooking: "予約を編集",
    viewOptions: {
      grid: "グリッド表示",
      list: "リスト表示"
    },
    actions: {
      sync: "予約を同期",
      refresh: "更新",
      generateInvoice: "請求書を生成",
      emailInvoice: "請求書をメールで送信"
    },
    cancelDialog: {
      title: "予約をキャンセル",
      description: "この予約をキャンセルしてもよろしいですか？この操作は元に戻せません。",
      cancel: "予約を維持",
      confirm: "はい、予約をキャンセルします"
    },
    invoice: {
      emailDescription: "請求書をPDF添付ファイルとして顧客のメールアドレスに送信します。",
      includeDetails: "予約詳細を含める"
    },
    billing: {
      title: "請求情報",
      details: "請求書発行のための請求情報を入力",
      companyName: "会社名",
      taxNumber: "税番号・VAT ID",
      streetName: "町名・番地",
      streetNumber: "建物名・部屋番号",
      city: "市区町村",
      state: "都道府県",
      postalCode: "郵便番号",
      country: "国",
      address: "住所"
    },
    tableHeaders: {
      bookingId: "予約ID",
      dateTime: "日時",
      service: "サービス",
      customer: "顧客",
      locations: "場所",
      status: "ステータス",
      actions: "アクション"
    },
    labels: {
      from: "出発地",
      to: "目的地"
    },
    status: {
      publish: "公開済み",
      pending: "保留中",
      confirmed: "確認済み",
      completed: "完了",
      cancelled: "キャンセル済み"
    },
    filters: {
      statusPlaceholder: "ステータスでフィルタリング",
      all: "すべて",
      pending: "保留中",
      confirmed: "確認済み",
      completed: "完了",
      cancelled: "キャンセル済み",
      advancedFilters: "詳細フィルター",
      clearFilters: "フィルターをクリア"
    },
    empty: {
      title: "予約が見つかりません",
      description: "システムにはまだ予約がありません。"
    },
    assignment: {
      title: "ドライバーと車両の割り当て",
      driver: "ドライバー",
      vehicle: "車両",
      selectDriver: "ドライバーを選択",
      selectVehicle: "車両を選択",
      driverDetails: "ドライバー詳細",
      vehicleDetails: "車両詳細",
      noDriversAvailable: "この予約時間に利用可能なドライバーがいません",
      noVehiclesAvailable: "利用可能な車両がありません",
      assignSuccess: "割り当てが正常に完了しました",
      assignFailed: "予約の割り当てに失敗しました",
      summary: "この予約にドライバーと車両を割り当てます",
      bookingDetails: "予約詳細",
      confirmAssignment: "割り当てを確定",
      notAssigned: "未割り当て",
      pickupDate: "ピックアップ日",
      pickupTime: "ピックアップ時間",
      pickupLocation: "ピックアップ場所",
      dropoffLocation: "降車場所",
      edit: "編集",
      saving: "保存中...",
      licensePlate: "ナンバープレート",
      vehicleBrand: "車両メーカー",
      vehicleModel: "車両モデル",
      alternativeVehicles: "代替車両",
      notAvailable: "利用不可",
      name: "名前",
      phone: "電話番号",
      email: "メールアドレス"
    },
    details: {
      title: "予約詳細",
      notFound: "予約が見つかりません",
      notFoundDescription: "お探しの予約が見つかりませんでした。",
      backToBookings: "予約一覧に戻る",
      createdOn: "作成日: {date}",
      lastUpdated: "最終更新: {date}",
      bookingNumber: "予約番号 #{id}",
      sections: {
        summary: "予約概要",
        vehicle: "車両情報",
        route: "ルート情報",
        client: "顧客詳細",
        additional: "追加情報",
        payment: "支払いリンク",
        assignment: "ドライバーと車両の割り当て",
        billingAddress: "請求先住所",
        billing: "請求情報",
        coupon: "クーポン情報"
      },
      fields: {
        bookingId: "予約ID",
        orderTotal: "注文合計",
        pickupDate: "ピックアップ日",
        paymentMethod: "支払い方法",
        pickupTime: "ピックアップ時間",
        paymentStatus: "支払い状況",
        vehicle: "車両",
        capacity: "定員",
        vehicleId: "車両ID",
        serviceType: "サービスタイプ",
        pickupLocation: "ピックアップ場所",
        dropoffLocation: "降車場所",
        distance: "距離",
        duration: "所要時間",
        flightNumber: "フライト番号",
        terminal: "ターミナル",
        comment: "コメント",
        email: "メール",
        phone: "電話番号",
        status: "ステータス",
        paymentLink: "支払いリンク",
        amount: "金額",
        originalPrice: "元の価格",
        finalAmount: "最終金額",
        name: "名前",
        serviceName: "サービス名",
        customerName: "顧客名",
        driver: "ドライバー",
        companyName: "会社名",
        taxNumber: "税番号 / VAT ID",
        street: "町名・番地",
        city: "市区町村",
        state: "都道府県",
        postalCode: "郵便番号",
        country: "国",
        coupon: "クーポン",
        couponCode: "クーポンコード",
        couponDiscount: "割引率",
        discount: "割引",
        address: "住所",
        cityState: "市区町村/都道府県/郵便番号",
        billingCompany: "請求先会社名"
      },
      quickCustomerActions: "クイック顧客アクション",
      tooltips: {
        emailTo: "メール送信先",
        callTo: "通話先",
        textTo: "テキスト送信先"
      },
      flightInformation: "フライト情報",
      notesAndInstructions: "備考と指示",
      actions: {
        navigateToPickup: "ピックアップ場所へナビゲート",
        navigateToDropoff: "降車場所へナビゲート",
        viewLargerMap: "大きな地図で見る",
        contactCustomer: "顧客に連絡",
        call: "電話",
        sendMessage: "メッセージを送信",
        openPaymentLink: "決済リンクを開く",
        edit: "編集",
        reschedule: "再スケジュール",
        cancel: "キャンセル",
        confirmCancel: "はい、予約をキャンセルします",
        confirmCancellation: "予約をキャンセルしますか？",
        cancellationWarning: "この予約をキャンセルしてもよろしいですか？この操作は元に戻せません。",
        cancelSuccess: "予約がキャンセルされました",
        cancelError: "予約のキャンセル中にエラーが発生しました",
        print: "印刷",
        viewInvoice: "請求書を表示",
        changeStatus: "ステータスを変更",
        addToCalendar: "Googleカレンダーに追加",
        printDetails: "詳細を印刷",
        copyClipboard: "クリップボードにコピー",
        tripChecklist: "旅行チェックリスト",
        sendArrivalNotification: "到着通知を送信",
        shareWhatsApp: "WhatsAppで共有",
        shareLine: "LINEで共有",
        shareEmail: "メールで共有",
        exportPdf: "PDFをエクスポート",
        generateInvoice: "請求書を作成",
        emailInvoice: "請求書をメールで送信",
        emailCustomer: "顧客にメール",
        callCustomer: "顧客に電話",
        textCustomer: "顧客にメッセージ"
      },
      weather: {
        title: "出発日の天気予報",
        notAvailable: "{date}の予報はありません",
        errorMessage: "天気予報の取得に失敗しました",
        disclaimer: "* 天気データはWeatherAPI.comによって提供されています",
        forecastUnavailable: "{date}の予報はありません"
      },
      bookingActions: {
        title: "予約アクション",
        addToGoogleCalendar: "Googleカレンダーに追加",
        managementActions: "管理アクション",
        editBooking: "予約を編集",
        rescheduleBooking: "予約を再スケジュール",
        dangerZone: "危険ゾーン",
        cancelBooking: "予約をキャンセル"
      },
      driverActions: {
        title: "ドライバーアクション",
        tripManagement: "配車管理",
        shareBooking: "予約を共有",
        addToGoogleCalendar: "Googleカレンダーに追加"
      },
      documents: {
        title: "書類"
      },
      customerSince: "{date}からの顧客",
      noDriversAvailable: "この予約時間に利用可能なドライバーがいません",
      noVehiclesAvailable: "利用可能な車両がありません",
      assignSuccess: "割り当てが正常に完了しました",
      assignFailed: "予約の割り当てに失敗しました",
      summary: "この予約にドライバーと車両を割り当てます",
      bookingDetails: "予約詳細",
      confirmAssignment: "割り当てを確定"
    },
    edit: {
      title: "予約 #{id} を編集",
      description: "この予約の情報を更新する",
      backToDetails: "詳細に戻る",
      saveChanges: "変更を保存",
      saving: "保存中...",
      success: "成功",
      error: "エラー",
      successMessage: "予約が正常に更新されました",
      errorMessage: "予約の更新中にエラーが発生しました"
    },
    messages: {
      createSuccess: "予約が正常に作成されました",
      updateSuccess: "予約が正常に更新されました",
      deleteSuccess: "予約が正常に削除されました",
      syncSuccess: "予約が正常に同期されました",
      error: "エラーが発生しました"
    },
    sync: {
      title: "予約の同期",
      description: "外部システムから予約を同期する",
      connectionIssue: "外部予約システムとの接続に問題がある可能性があります。",
      success: "予約が正常に同期されました",
      failed: "同期に失敗しました",
      syncing: "同期中...",
      syncButton: "予約を同期",
      retrying: "再試行中...",
      retryButton: "接続を再試行",
      successWithCount: "{count}件の予約を同期しました（{created}件作成、{updated}件更新）",
      confirmUpdates: "予約更新の確認",
      confirmUpdatesDescription: "以下の予約に変更があります。更新する予約を選択してください。",
      syncSummary: "新規予約が{newCount}件、更新可能な予約が{updateCount}件見つかりました。",
      newBookingsAutomatically: "新規予約は自動的に作成されます。",
      confirmAndSync: "確認して同期",
      cancelled: "同期はユーザーによりキャンセルされました",
      changesSummary: "変更の概要",
      searchPlaceholder: "予約を検索...",
      allChanges: "すべての変更",
      perPage: "ページあたり{count}件",
      previous: "前へ",
      next: "次へ",
      current: "現在",
      afterUpdate: "更新後",
      dateTime: "日時",
      importedBy: "インポート者"
    },
    calculateRoute: "ルート距離と時間を計算",
    autoCalculateAvailable: "自動計算可能",
    placeholders: {
      enterPickupAddress: "出発地を入力してください",
      enterDropoffAddress: "目的地を入力してください",
      enterBothLocations: "ルートを表示するには、出発地と目的地の両方を入力してください"
    }
  },
  dispatch: {
    title: "配車ボード",
    description: "予約のドライバーと車両の割り当てを管理",
    search: "配車エントリーを検索...",
    filters: {
      status: "ステータス",
      date: "日付",
      driver: "ドライバー",
      vehicle: "車両",
      all: "すべてのエントリー"
    },
    actions: {
      assignDriver: "ドライバーを割り当て",
      assignVehicle: "車両を割り当て",
      updateStatus: "ステータスを更新",
      addNote: "メモを追加",
      viewDetails: "詳細を表示",
      createEntry: "エントリーを作成",
      editEntry: "エントリーを編集",
      deleteEntry: "エントリーを削除",
      assignDriverTo: "予約#{id}にドライバーを割り当て",
      assignVehicleTo: "予約#{id}に車両を割り当て"
    },
    status: {
      pending: "保留中",
      assigned: "割り当て済み",
      in_transit: "移動中",
      completed: "完了",
      cancelled: "キャンセル"
    },
    fields: {
      booking: "予約",
      driver: "ドライバー",
      vehicle: "車両",
      status: "ステータス",
      startTime: "開始時間",
      endTime: "終了時間",
      duration: "所要時間",
      notes: "メモ",
      createdAt: "作成日時",
      updatedAt: "更新日時"
    },
    placeholders: {
      selectDriver: "ドライバーを選択",
      selectVehicle: "車両を選択",
      selectStatus: "ステータスを選択",
      enterNotes: "この配車に関するメモを入力",
      startTime: "開始時間を選択",
      endTime: "終了時間を選択"
    },
    messages: {
      createSuccess: "配車エントリーが正常に作成されました",
      updateSuccess: "配車エントリーが正常に更新されました",
      deleteSuccess: "配車エントリーが正常に削除されました",
      createError: "配車エントリーの作成中にエラーが発生しました",
      updateError: "配車エントリーの更新中にエラーが発生しました",
      deleteError: "配車エントリーの削除中にエラーが発生しました",
      driverAssigned: "ドライバーが正常に割り当てられました",
      vehicleAssigned: "車両が正常に割り当てられました",
      statusUpdated: "ステータスが正常に更新されました",
      notesAdded: "メモが正常に追加されました"
    },
    empty: {
      title: "配車エントリーが見つかりません",
      description: "選択されたフィルターに一致する配車エントリーはありません。",
      searchResults: "検索条件に一致する配車エントリーはありません。検索条件を変更してください。"
    },
    calendar: {
      view: "カレンダー表示",
      title: "配車カレンダー",
      today: "今日",
      month: "月",
      week: "週",
      day: "日",
      list: "リスト"
    },
    board: {
      view: "ボード表示",
      title: "配車ボード",
      pending: "保留中",
      assigned: "割り当て済み",
      inTransit: "移動中",
      completed: "完了",
      cancelled: "キャンセル",
      addEntry: "エントリーを追加"
    },
    details: {
      title: "配車詳細",
      bookingDetails: "予約詳細",
      driverDetails: "ドライバー詳細",
      vehicleDetails: "車両詳細",
      statusHistory: "ステータス履歴",
      notes: "配車メモ"
    },
    timelineView: {
      title: "配車タイムライン",
      scale: "スケール",
      hour: "時間",
      day: "日",
      week: "週",
      zoomIn: "拡大",
      zoomOut: "縮小"
    }
  },
  type: {
    select: "点検タイプを選択",
    routine: "定期点検",
    safety: "安全点検",
    maintenance: "メンテナンス点検",
    description: {
      routine: "車両システムの総合点検",
      safety: "安全システムの重要点検",
      maintenance: "定期メンテナンス確認"
    }
  },
  googleMapsApiKeyMissing: "Google Maps APIキーが設定されていません",
  googleMapsApiKeyMissingDescription: "Google Maps APIキーが設定されていません。環境変数にNEXT_PUBLIC_GOOGLE_MAPS_API_KEYを追加してください。手動での住所入力は引き続き機能します。"
} as const 