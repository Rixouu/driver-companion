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
    previous: "前へ",
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
    unassign: "割り当て解除",
    cannotBeUndone: "この操作は元に戻せません。",
    updateAndSend: "更新して送信",
    processing: "処理中...",
    copy: "コピー",
    dateFormat: {
      short: "YYYY/MM/DD",
      medium: "YYYY年M月D日",
      long: "YYYY年M月D日",
      monthYear: "YYYY年M月"
    },
    formHasErrors: "送信前にフォームのエラーを修正してください",
    exportPDF: "PDFをエクスポート",
    exportCSV: "CSVをエクスポート",
    notAvailable: "該当なし"
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
    dispatch: "配車ボード",
    quotations: "見積書",
    logout: "ログアウト",
    // Mobile menu specific translations
    operations: "運営",
    fleet: "フリート",
    sales: "営業"
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
    pagination: {
      showing: "{total}件中{start}〜{end}件を表示",
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
      quotations: "見積書",
      dispatch: "配車ボード",
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
    createNewInspection: "新規点検作成",
    createNewInspectionDescription: "以下のフォームを記入して新しい点検を作成します",
    editInspection: "点検を編集",
    searchPlaceholder: "点検を検索...",
    noInspections: "点検が見つかりません",
    createInspection: "点検を作成",
    defaultType: "定期点検",
    groupBy: "グループ化",
    addNew: "上のボタンをクリックして最初の点検を作成してください",
    groupByOptions: {
      none: "なし",
      date: "日付",
      vehicle: "車両"
    },
    steps: {
      selectVehicle: "車両を選択",
      selectType: "点検タイプを選択"
    },
    labels: {
      progress: "点検の進捗",
      estimatedTime: "推定残り時間",
      model: "モデル",
      photoNumber: "写真 {{number}}",
      currentSection: "現在のセクション",
      showingVehicles: "{{total}}台中の{{start}}〜{{end}}台を表示"
    },
    actions: {
      pass: "合格",
      fail: "不合格",
      complete: "点検を完了",
      markComplete: "完了としてマーク",
      markInProgress: "点検を開始",
      startInspection: "点検を開始",
      addPhoto: "写真を追加",
      addNote: "メモを追加",
      viewDetails: "詳細を表示",
      previousSection: "前のセクション",
      nextSection: "次のセクション",
      completeInspection: "点検を完了する",
      takePhoto: "写真を撮る",
      photos: "写真{{count}}枚",
      needsRepair: "修理が必要な項目",
      scheduleRepair: "修理を予定",
      scheduleRepairDescription: "不合格項目のメンテナンスタスクを作成する"
    },
    status: {
      pending: "保留中",
      inProgress: "進行中",
      completed: "完了",
      failed: "不合格"
    },
    type: {
      routine: "定期点検",
      safety: "安全点検",
      maintenance: "メンテナンス点検",
      description: {
        routine: "車両システムの総合点検",
        safety: "安全に関する重要なコンポーネントの集中点検"
      }
    },
    fields: {
      date: "日付",
      type: "タイプ",
      status: "ステータス",
      vehicle: "車両",
      inspector: "検査員",
      inspectorName: "検査員名",
      inspectorEmail: "検査員メールアドレス",
      notes: "メモ",
      notesPlaceholder: "この項目についてのメモを追加...",
      photos: "写真",
      photo: "写真"
    },
    messages: {
      saveSuccess: "点検を保存しました",
      saveError: "点検の保存中にエラーが発生しました",
      exportSuccess: "点検をエクスポートしました",
      exportError: "点検のエクスポート中にエラーが発生しました",
      completeSuccess: "点検を完了としてマークしました",
      completeError: "点検の完了中にエラーが発生しました",
      printStarted: "印刷を開始しました"
    },
    dateLabel: "点検日",
    templates: {
      itemNameLabel: "項目名"
    },
    details: {
      title: "点検詳細",
      printTitle: "点検レポート",
      scheduledFor: "{date}に予定",
      inspectionItems: "点検項目",
      sections: {
        vehicle: "車両情報",
        inspection: "点検情報",
        summary: "概要",
        items: "点検項目",
        steering_system: "ステアリングシステム",
        brake_system: "ブレーキシステム",
        suspension: "サスペンションシステム",
        lighting: "ライティングシステム",
        tires: "タイヤ",
        engine: "エンジン",
        transmission: "トランスミッション",
        electrical: "電気系統",
        safety_equipment: "安全装備",
        brake_safety: "ブレーキ安全性",
        scheduled_maintenance: "定期メンテナンス",
        wear_items: "消耗品",
        visibility: "視認性",
        restraint_systems: "拘束システム",
        diagnostics: "診断",
        other: "その他"
      },
      vehicleInfo: {
        title: "車両情報",
        plateNumber: "ナンバープレート",
        brand: "メーカー",
        model: "モデル",
        year: "年式",
        noImage: "画像なし"
      },
      inspectionDetails: "点検詳細",
      inspector: {
        title: "検査員",
        name: "検査員名",
        email: "検査員メールアドレス"
      },
      results: {
        title: "点検結果",
        passCount: "合格項目数: {count}",
        failCount: "不合格項目数: {count}",
        photoCount: "撮影写真数: {count}",
        notesCount: "メモ付き項目数: {count}",
        completionRate: "完了率",
        lastUpdated: "最終更新",
        failedItemsFound: "不合格項目あり",
        failedItemsDescription: "以下の項目が点検基準を満たしていません。",
        allPassed: "全項目合格",
        noFailedItems: "この点検では不合格項目はありませんでした。",
        passedLabel: "合格項目",
        failedLabel: "不合格項目",
        notesLabel: "追加メモ",
        photosLabel: "撮影写真"
      },
      tabs: {
        details: "詳細",
        failed: "不合格項目",
        passed: "合格項目",
        photos: "写真",
        notes: "メモ"
      },
      photos: {
        title: "写真",
        downloadPhoto: "写真をダウンロード"
      },
      vehicleDetails: "車両詳細",
      exportResult: "結果をエクスポート",
      actions: {
        exportResult: "結果をエクスポート",
        needsRepair: "修理が必要な項目",
        scheduleRepair: "修理を予定",
        scheduleRepairDescription: "不合格項目のメンテナンスタスクを作成する"
      },
      dateLabel: "点検日"
    },
    notesPlaceholder: "この項目についてのメモを追加...",
    noVehicle: "車両未割り当て",
    dateGroup: {
      today: "今日",
      yesterday: "昨日",
      thisWeek: "今週",
      thisMonth: "今月",
      upcoming: "近日予定",
      older: "それ以前",
      unknown: "不明な日付"
    },
    stats: {
      count: "{{count}}件の点検",
      vehicleCount: "{{count}}件の点検"
    },
    sections: {
      lighting: {
        title: "ライティングシステム",
        items: {
          taillights: { title: "テールランプ", description: "テールランプの動作と状態を確認します。" },
          turn_indicators: { title: "方向指示器", description: "方向指示器の動作と状態を確認します。" },
          headlights: { title: "ヘッドライト", description: "ヘッドライトの動作と状態を確認します。" },
          brake_lights: { title: "ブレーキランプ", description: "ブレーキランプの動作と状態を確認します。" }
        }
      },
      tires: {
        title: "タイヤ",
        items: {
          tire_pressure: { title: "タイヤ空気圧", description: "タイヤの空気圧を推奨レベルに確認・調整します。" },
          tread_depth: { title: "トレッドの深さ", description: "タイヤのトレッドの深さを測定し、十分なグリップがあるか確認します。" },
          wear_pattern: { title: "摩耗パターン", description: "タイヤの不均一な摩耗パターンを検査します。" }
        }
      },
      engine: {
        title: "エンジン",
        items: {
          oil_level: { title: "オイルレベル", description: "エンジンオイルのレベルと状態を確認します。" },
          coolant_level: { title: "クーラントレベル", description: "エンジンクーラントのレベルと状態を確認します。" },
          drive_belts: { title: "ドライブベルト", description: "ドライブベルトの摩耗と張力を検査します。" },
          fluid_leaks: { title: "液体漏れ", description: "エンジンの液体漏れがないか確認します。" }
        }
      },
      transmission: {
        title: "トランスミッション",
        items: {
          shifting_operation: { title: "シフト操作", description: "トランスミッションがスムーズにシフトするかテストします。" },
          clutch_operation: { title: "クラッチ操作", description: "クラッチのエンゲージメントと操作を確認します（該当する場合）。" }
        }
      },
      electrical: {
        title: "電気系統",
        items: {
          battery_condition: { title: "バッテリー状態", description: "バッテリー端子と全体的な状態を検査します。" },
          alternator_output: { title: "オルタネーター出力", description: "オルタネーターの充電電圧を確認します。" },
          starter_operation: { title: "スターター操作", description: "スターターモーターの動作をテストします。" }
        }
      },
      safety_equipment: {
        title: "安全装備",
        items: {
          seatbelt_operation: { title: "シートベルト操作", description: "すべてのシートベルトが適切に機能し、良好な状態であるか確認します。" },
          airbag_system: { title: "エアバッグシステム", description: "エアバッグ警告灯の状態を確認します（アクティブな障害なし）。" },
          wiper_operation: { title: "ワイパー操作", description: "フロントガラスワイパーとウォッシャー液の動作をテストします。" },
          horn_operation: { title: "ホーン操作", description: "ホーンの動作をテストします。" }
        }
      },
      steering_system: {
        title: "ステアリングシステム",
        items: {
          power_steering: { title: "パワーステアリング", description: "パワーステアリングフルードのレベルと漏れを確認します。動作をテストします。" },
          steering_column: { title: "ステアリングコラム", description: "ステアリングコラムの緩みや遊びを検査します。" }
        }
      },
      brake_system: {
        title: "ブレーキシステム",
        items: {
          brake_pedal: { title: "ブレーキペダル", description: "ブレーキペダルの感触と遊びを確認します。" },
          brake_discs: { title: "ブレーキディスク/パッド", description: "ブレーキディスクとパッドの摩耗を検査します。" },
          brake_fluid: { title: "ブレーキフルード", description: "ブレーキフルードのレベルと状態を確認します。" }
        }
      },
      suspension: {
        title: "サスペンションシステム",
        items: {
          shock_absorbers: { title: "ショックアブソーバー", description: "ショックアブソーバーの漏れや損傷を検査します。" },
          springs: { title: "スプリング", description: "サスペンションスプリングの損傷やたるみを検査します。" },
          bushings: { title: "ブッシュ", description: "サスペンションブッシュの摩耗や損傷を検査します。" }
        }
      },
      other: {
        title: "その他",
        items: {
          lighting_device: { 
            title: "照明装置", 
            description: "ナンバープレートライトを含むすべての外部ライトの動作を確認" 
          },
          blinkers_hazards: { 
            title: "ウインカー・ハザード", 
            description: "方向指示器とハザードランプの動作を確認" 
          },
          brake_lights: { 
            title: "ブレーキライト", 
            description: "ペダルを踏んだときのブレーキライトの作動を確認" 
          },
          engine_oil: { 
            title: "エンジンオイル", 
            description: "ディップスティックを使用してオイルレベルと状態を確認" 
          },
          brake_fluid_volume: { 
            title: "ブレーキ液量", 
            description: "ブレーキ液リザーバー内の液量を確認" 
          },
          radiator_fluid: { 
            title: "ラジエーターリザーバータンク液量", 
            description: "リザーバータンク内の冷却水レベルを確認" 
          },
          liquid_leakage: { 
            title: "液体漏れ（車両下部）", 
            description: "流体漏れの兆候がないか車両下部を点検" 
          }
        }
      },
      items: {
        title: "点検項目",
        itemHeader: "項目",
        statusHeader: "状態",
        notesHeader: "メモ"
      }
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
    maintenance: "メンテナンス",
    description: {
      routine: "車両システムの総合点検",
      safety: "安全に関する重要なコンポーネントの集中点検"
    }
  },
  googleMapsApiKeyMissing: "Google Maps APIキーが設定されていません",
  googleMapsApiKeyMissingDescription: "Google Maps APIキーが設定されていません。環境変数にNEXT_PUBLIC_GOOGLE_MAPS_API_KEYを追加してください。手動での住所入力は引き続き機能します。",
  
  quotations: {
    title: "見積書",
    description: "お客様向けの見積書を作成・管理する",
    create: "見積書作成",
    edit: "見積書編集",
    view: "見積書を表示",
    duplicate: "見積書複製",
    placeholder: "見積書が見つかりません",
    list: "すべての見積書",
    listDescription: "お客様の見積書を管理・追跡する",
    filters: {
      all: "すべての見積書",
      searchPlaceholder: "見積書を検索...",
      clearFilters: "フィルターをクリア",
      noResults: "検索条件に一致する見積書はありません"
    },
    form: {
      create: "新規見積書作成",
      update: "見積書を更新",
      customerSection: "顧客情報",
      detailsSection: "見積書詳細",
      servicesSection: "サービス情報",
      serviceSection: "サービス情報",
      priceSection: "価格詳細",
      pricingSection: "価格情報",
      notesSection: "メモとコメント",
      previewSection: "プレビュー",
      saveAsDraft: "下書きとして保存",
      sendToCustomer: "顧客に送信",
      title: "タイトル",
      placeholders: {
        title: "見積書のタイトルを入力",
        customerName: "顧客名を入力",
        customerEmail: "顧客のメールアドレスを入力",
        customerPhone: "顧客の電話番号を入力",
        merchantNotes: "内部メモ（自分だけに表示）",
        customerNotes: "顧客向けメモ（顧客にも表示されます）"
      },
      customerName: "顧客名",
      customerEmail: "顧客メール",
      customerPhone: "顧客電話番号",
      discountPercentage: "割引率",
      taxPercentage: "税率",
      merchantNotes: "内部メモ",
      customerNotes: "顧客向けメモ"
    },
    pricing: {
      total: "合計金額",
      subtotal: "小計",
      tax: "税金",
      discount: "割引"
    },
    listColumns: {
      id: "ID",
      customer: "顧客",
      date: "日付",
      amount: "金額",
      status: "ステータス",
      expiresOn: "有効期限",
      actions: "アクション"
    },
    notifications: {
      createSuccess: "見積書が正常に作成されました",
      updateSuccess: "見積書が正常に更新されました",
      deleteSuccess: "見積書が正常に削除されました",
      error: "エラー",
      sendSuccess: "見積書が送信されました",
      updateAndSendSuccess: "更新された見積書が送信されました",
      partialSuccess: "部分的に成功",
      emailFailed: "メールは送信されましたが、ステータスの更新に失敗しました",
      approveSuccess: "見積書が正常に承認されました",
      rejectSuccess: "見積書が正常に拒否されました",
      convertSuccess: "見積書が正常に予約に変換されました",
      reminderSuccess: "リマインダーが正常に送信されました",
      deleteConfirmation: "この見積書を削除してもよろしいですか？",
      alreadyApproved: "この見積書は既に承認されています",
      notApproved: "承認された見積書のみ変換できます",
      alreadyConverted: "この見積書は既に変換されています",
      expired: "この見積書は期限切れです",
      cannotReject: "この見積書は拒否できません"
    },
    messageBlock: {
      title: "会話",
      noMessages: "メッセージはまだありません",
      startConversation: "この見積書について顧客との会話を開始する",
      typePlaceholder: "メッセージを入力してください...",
      send: "メッセージを送信",
      pressEnterHint: "Ctrl+Enterで送信",
      messageCounter: "{count}件のメッセージ",
      loadMore: "さらに表示",
      unreadMessages: "{count}件の未読メッセージ"
    },
    activities: {
      created: "見積書が作成されました",
      updated: "見積書が更新されました",
      sent: "見積書が顧客に送信されました",
      approved: "見積書が顧客に承認されました",
      rejected: "見積書が顧客に却下されました",
      converted: "見積書が予約に変換されました",
      message: "メッセージが追加されました",
      refresh: "活動履歴を更新",
      loadMore: "さらに表示 (残り{count}件)",
      filters: {
        all: "すべての活動",
        updates: "更新",
        messages: "メッセージ"
      },
      empty: {
        all: "活動履歴はまだありません",
        updates: "更新はありません",
        messages: "メッセージはありません"
      },
      feed: {
        created: "{userName}がこの見積書を作成しました",
        updated: "{userName}が見積書の詳細を更新しました",
        sent: "{userName}が見積書を顧客に送信しました",
        approved: "{userName}が見積書を承認しました",
        rejected: "{userName}が見積書を却下しました：\"{reason}\"",
        converted: "{userName}が見積書を予約に変換しました",
        message: "{userName}がメッセージを送信しました：\"{message}\"",
        default: "{userName}がアクションを実行しました：{action}"
      }
    },
    details: {
      title: "見積書詳細",
      description: "見積書の詳細を表示・管理する",
      quotationNumber: "見積書番号 #{id}",
      customerInfo: "顧客情報",
      contactInfo: "連絡先情報",
      billingAddress: "請求先住所",
      taxId: "税番号",
      serviceInfo: "サービス情報",
      serviceDetails: "サービス詳細",
      serviceType: "サービスタイプ",
      vehicleType: "車両タイプ",
      duration: "所要時間",
      hours: "時間",
      days: "日",
      schedule: "スケジュール",
      pickupDate: "集合日",
      pickupTime: "集合時間",
      priceDetails: "価格詳細",
      validUntil: "{date}まで有効",
      created: "作成日",
      expiry: "有効期限",
      validFor: "有効期間",
      locations: "場所",
      pickup: "集合場所",
      dropoff: "目的地",
      notes: "備考",
      notesAndTerms: "備考と利用規約",
      termsAndConditions: "利用規約",
      activities: "活動履歴",
      untitled: "無題の見積書",
      expires: "期限切れ",
      expired: "{date}に期限切れ",
      info: "見積書情報",
      status: "見積書ステータス",
      noActivities: "活動履歴はまだありません",
      noFilteredActivities: "このタイプの活動はありません",
      approvalPanel: {
        title: "見積書承認",
        approveButton: "見積書を承認",
        rejectButton: "見積書を却下",
        approveConfirmation: "この見積書を承認してもよろしいですか？",
        rejectConfirmation: "この見積書を却下してもよろしいですか？",
        notesLabel: "メモ（任意）",
        notesPlaceholder: "決定に関するメモやコメントを追加",
        reasonLabel: "却下理由",
        reasonPlaceholder: "この見積書を却下する理由を入力してください",
        approvalSuccess: "見積書が正常に承認されました",
        rejectionSuccess: "見積書が正常に却下されました"
      }
    },
    status: {
      draft: "下書き",
      sent: "送信済み",
      approved: "承認済み",
      rejected: "却下済み",
      expired: "期限切れ",
      converted: "予約に変換済み"
    },
    actions: {
      view: "表示",
      edit: "編集",
      delete: "削除",
      send: "送信",
      copy: "複製",
      remind: "リマインダー送信",
      print: "印刷",
      download: "PDFをダウンロード",
      email: "見積書をメール送信"
    },
    emailDescription: "見積書をPDF添付ファイルとして顧客のメールアドレスに送信します。",
    includeDetails: "見積書の詳細を含める",
    editSection: {
      title: "見積書編集",
      description: "見積書の詳細を変更する",
      notEditable: "この見積書は編集できません",
      notEditableDescription: "下書きまたは送信済みステータスの見積書のみ編集可能です。"
    },
    empty: {
      title: "見積書が見つかりません",
      description: "まだ見積書が作成されていません。",
      cta: "見積書を作成"
    }
  },
  email: {
    quotation: {
      approved: {
        subject: "見積書が承認されました"
      },
      rejected: {
        subject: "見積書が却下されました"
      }
    }
  },
  notAuthorized: {
    title: "アクセス拒否",
    description: "このエリアへのアクセス権限がありません。Japan Driverスタッフのみがこのセクションにアクセスできます。",
    loginButton: "別のアカウントでログイン"
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
      createQuotation: "見積書を作成",
      viewReports: "レポートを表示"
    },
    activityFeed: {
      title: "アクティビティフィード",
      description: "最近および今後のアクティビティ",
      noUpcoming: "予定されているアクティビティはありません",
      noRecent: "最近のアクティビティはありません",
      viewAll: "すべて表示"
    },
    dailyChecklist: {
      title: "デイリーチェックリスト",
      description: "今日完了するタスク",
      completeChecklist: "チェックリストを完了",
      checkAllItems: "すべての項目をチェックして完了",
      upcomingReminders: "今後のリマインダー",
      completed: {
        title: "チェックリスト完了！",
        message: "お疲れ様でした！デイリーチェックがすべて完了しました。また明日！",
        reset: "チェックリストをリセット"
      },
      items: {
        checkTires: "タイヤの空気圧と状態を確認",
        checkLights: "すべてのライトの機能を確認",
        checkFluids: "オイルとクーラントのレベルを確認",
        checkBrakes: "ブレーキとパーキングブレーキをテスト",
        visualInspection: "視覚検査を実施"
      }
    },
    upcomingBookings: {
      title: "予定された予約",
      description: "レビューと割り当て待ちの予約",
      viewAll: "すべての予約を表示",
      empty: {
        title: "予定された予約はありません",
        description: "レビューまたは割り当て待ちの予約はありません。",
        message: "予定された予約はありません"
      }
    },
    vehicleStats: {
      title: "車両概要",
      description: "車両に関する簡単な統計",
      fuelLevel: "燃料レベル",
      mileage: "走行距離",
      viewAllVehicles: "すべての車両を表示"
    },
    maintenance: {
      title: "メンテナンス",
      description: "予定および最近のメンテナンスタスク",
      noTasksScheduled: "予定されたメンテナンスタスクはありません",
      noTasksCompleted: "完了したメンテナンスタスクはありません",
      noTasksInProgress: "進行中のメンテナンスタスクはありません",
      viewAll: "すべてのメンテナンスタスクを表示"
    },
    inspections: {
      title: "点検",
      description: "予定および最近の点検",
      noInspectionsScheduled: "予定された点検はありません",
      noInspectionsCompleted: "完了した点検はありません",
      noInspectionsInProgress: "進行中の点検はありません",
      viewAll: "すべての点検を表示"
    },
    stats: {
      totalVehicles: "車両総数",
      maintenanceTasks: "メンテナンスタスク",
      inspections: "点検",
      activeVehicles: "稼働中の車両",
      vehiclesInMaintenance: "メンテナンス中",
      scheduledInspections: "予定済み",
      inProgressInspections: "進行中",
      completedInspections: "完了",
      pendingTasks: "保留中",
      inProgressTasks: "進行中",
      completedTasks: "完了"
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
      },
      inProgress: {
        title: "進行中",
        maintenance: "進行中のメンテナンス",
        inspections: "進行中の点検",
        noTasks: "進行中のタスクはありません"
      }
    },
    tabs: {
      recent: "最近",
      upcoming: "予定",
      inProgress: "進行中"
    }
  } as const
}