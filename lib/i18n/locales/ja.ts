import { TranslationValue } from "../types"

export const ja: TranslationValue = {
  quotations: {
    notifications: {
      createSuccess: "見積りを作成しました",
      updateSuccess: "見積りを更新しました",
      deleteSuccess: "見積りを削除しました",
      reminderSuccess: "リマインダーを送信しました",
      error: "エラー",
      success: "成功",
      sendSuccess: "見積りを送信しました"
    },
    share: {
      button: "共有",
      message: "この見積りをご確認ください: {title} ({number})\n\n{url}",
      whatsapp: {
        title: "WhatsApp",
        success: "WhatsAppを開きました",
        description: "WhatsAppで見積りを共有"
      },
      line: {
        title: "LINE",
        success: "LINEを開きました",
        description: "LINEで見積りを共有"
      },
      copy: {
        title: "リンクをコピー",
        success: "リンクをコピーしました！",
        description: "見積りリンクをクリップボードにコピーしました",
        error: "リンクのコピーに失敗しました",
        errorDescription: "URLを手動でコピーしてください"
      }
    },
    form: {
      pricingSection: "料金情報",
      currencySettings: "通貨設定",
      discountPercentage: "割引率",
      taxPercentage: "税率",
      pricingTabs: {
        basic: "基本料金",
        packages: "パッケージ",
        promotions: "プロモーション",
        timepricing: "時間帯料金"
      },
      promotions: {
        title: "プロモーション",
        description: "プロモーションコードと割引の管理",
        enterCode: "プロモーションコードを入力",
        apply: "適用",
        availablePromotions: "利用可能なプロモーション",
        noPromotions: "利用可能なプロモーションはありません",
        invalid: "無効なプロモーションコードです",
        notActive: "このプロモーションはまだ有効ではありません",
        expired: "このプロモーションは期限切れです",
        usageLimitReached: "このプロモーションの利用上限に達しました",
        minimumAmount: "必要な最小注文金額:",
        applied: "適用済み",
        discount: "割引",
        promotionApplied: "プロモーションが適用されました",
        maxDiscount: "最大割引: {amount}"
      },
      timePricing: {
        title: "時間帯料金",
        automatic: "自動時間帯調整",
        description: "受取日時に応じて時間帯料金ルールが自動的に適用されます。",
        features: {
          peakHours: "ピーク時間（朝・夕方のラッシュ）",
          nightSurcharge: "深夜割増（夜間・早朝）",
          weekendPricing: "週末料金",
          holidayPricing: "祝日・イベント期間の特別料金"
        },
        status: {
          title: "現在の状態",
          active: "時間帯ルールが自動適用されます",
          inactive: "受取日時を設定すると適用されます"
        },
        howItWorks: {
          title: "仕組み",
          description: "受取日時を設定すると、該当する時間帯料金ルールが自動的に判定され、調整が最終見積りに反映されます。"
        }
      },
      currencyInfo: {
        title: "通貨と為替レート",
        description: "表示のためにリアルタイム為替レートで換算します。請求はアカウント通貨で行われる場合があります。",
        lastUpdated: "レート最終更新: {date}",
        disclaimer: "為替レートは目安であり、決済時に異なる場合があります。"
      },
      taxInfo: {
        title: "税率ガイド",
        japan: "日本の消費税: 標準10%（特定品目は8%軽減）。旅客輸送サービスは通常10%です。",
        thailand: "タイのVAT: 標準7%",
        applyRecommended: "推奨値（{percent}%）を適用"
      }
    }
  },
  common: {
    active: "有効",
    inactive: "無効",
    status: {
      inProgress: "進行中",
      upcoming: "今後",
      recent: "最近",
      active: "有効",
      inactive: "無効",
      completed: "完了",
      scheduled: "スケジュール済み",
      type: "タイプ",
      pass: "合格",
      fail: "不合格",
      pending: "保留中",
      booking: "予約"
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
    noResults: "結果が見つかりませんでした",
    details: "詳細",
    actions: {
      default: "アクション"
    },
    actionsMenu: {
      default: "アクション",
      goHome: "ホームに戻る",
      tryAgain: "再試行",
      chat: "チャット"
    },
    viewDetails: "詳細を表示",
    addNew: "新規追加",
    backTo: "に戻る",
    backToList: "一覧に戻る",
    saving: "保存中...",
    update: "更新",
    create: "作成",
    created: "作成済み",
    deleting: "削除中...",
    creating: "作成中...",
    menu: "メニュー",
    login: "ログイン",
    logout: "ログアウト",
    language: "言語",
    emailPlaceholder: "customer@example.com",
    darkMode: "ダークモード",
    inProgress: "進行中",
    upcoming: "予定",
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
    text: "テキスト",
    line: "LINE",
    exporting: "エクスポート中...",
    email: "メール",
    send: "メールを送信",
    sending: "送信中...",
    selected: "選択済み",
    current: "現在",
    updated: "更新済み",
    day: "日",
    week: "週",
    month: "月",
    today: "今日",
    unassign: "割り当て解除",
    assign: "割り当て",
    none: "なし",
    cannotBeUndone: "この操作は元に戻せません。",
    updateAndSend: "更新して送信",
    processing: "処理中...",
    copy: "コピー",
    activate: "有効化",
    deactivate: "無効化",
    dateFormat: {
      short: "YYYY/MM/DD",
      medium: "YYYY年M月D日",
      long: "YYYY年M月D日",
      monthYear: "YYYY年M月"
    },
    formHasErrors: "送信する前にフォームのエラーを修正してください",
    exportPDF: "PDFをエクスポート",
    exportCSV: "CSVをエクスポート",
    notAvailable: "N/A",
    notAvailableShort: "N/A",
    recentActivity: "最近のアクティビティ",
    date: "日付",
    cost: "費用",
    forms: {
      required: "必須"
    },
    notifications: {
      success: "成功",
      error: "エラー"
    },
    duplicate: "複製",
    time: "時間",
    showingResults: "{total}件の結果のうち{start}～{end}件を表示中",
    nameEn: "名前（英語）",
    nameJa: "名前（日本語）",
    descriptionEn: "説明（英語）",
    descriptionJa: "説明（日本語）",
    order: "順序",
    add: "追加",
    clearFilters: "フィルターをクリア"
  },
  calendar: {
    weekdays: {
      mon: "月",
      tue: "火",
      wed: "水",
      thu: "木",
      fri: "金",
      sat: "土",
      sun: "日"
    },
    months: {
      january: "1月",
      february: "2月",
      march: "3月",
      april: "4月",
      may: "5月",
      june: "6月",
      july: "7月",
      august: "8月",
      september: "9月",
      october: "10月",
      november: "11月",
      december: "12月"
    }
  },
  auth: {
    logout: "ログアウト"
  },
  navigation: {
    dashboard: "ダッシュボード",
    vehicles: "車両",
    drivers: "ドライバー",
    bookings: "予約",
    quotations: "見積",
    pricing: "価格設定",
    dispatch: "配車",
    assignments: "割り当て",
    maintenance: "メンテナンス",
    inspections: "点検",
    reporting: "レポート",
    settings: "設定",
    fleet: "フリート",
    sales: "営業",
    operations: "オペレーション",
    logout: "ログアウト"
  },
  drivers: {
    title: "ドライバー",
    description: "ドライバー情報を管理します",
    backToDriver: "ドライバーに戻る",
    search: "ドライバーを検索...",
    filters: {
      status: "ステータス",
      all: "すべてのドライバー",
      searchPlaceholder: "ドライバーを検索...",
      brand: "ステータスで絞り込み",
      model: "タイプで絞り込み",
      allBrands: "すべてのステータス",
      allModels: "すべてのタイプ",
      noResults: "結果が見つかりませんでした",
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
      licenseExpiry: "免許証有効期限",
      expires: "有効期限",
      status: "ステータス",
      address: "住所",
      emergencyContact: "緊急連絡先",
      notes: "メモ",
      idLabel: "ID"
    },
    placeholders: {
      firstName: "名を入力",
      lastName: "姓を入力",
      email: "メールアドレスを入力",
      phone: "電話番号を入力",
      lineId: "LINE IDを入力",
      licenseNumber: "免許証番号を入力",
      licenseExpiry: "有効期限を選択",
      address: "住所を入力",
      emergencyContact: "緊急連絡先を入力",
      notes: "追加のメモを入力"
    },
    status: {
      title: "ステータス",
      active: "有効",
      inactive: "無効",
      on_leave: "休暇中",
      training: "研修中",
      available: "対応可能",
      unavailable: "対応不可",
      leave: "休暇中"
    },
    availability: {
      title: "ドライバーの空き状況",
      description: "このドライバーの空き時間を管理します。対応可能、休暇中、研修中の期間を設定します。",
      setStatus: "ステータスを設定",
      statusLabel: "空き状況ステータス",
      selectStatus: "ステータスを選択",
      addAvailability: "空き時間を追加",
      editAvailability: "空き時間を編集",
      deleteAvailability: "空き時間を削除",
      calendarView: "カレンダービュー",
      listView: {
        title: "リストビュー",
        noRecords: "空き状況の記録が見つかりません。上のボタンをクリックして追加してください。",
        loading: "読み込み中...",
        addAvailability: "空き時間を追加",
        editAvailability: "空き時間を編集",
        deleteConfirmTitle: "よろしいですか？",
        deleteConfirmMessage: "この操作は元に戻せません。これにより、空き状況の記録が永久に削除されます。",
        deleteSuccess: "空き状況を削除しました",
        deleteSuccessMessage: "ドライバーの空き状況が正常に削除されました",
        deleteError: "ドライバーの空き状況の削除に失敗しました",
        loadError: "ドライバーの空き状況の読み込みに失敗しました",
        editDisabledTooltip: "予約の割り当ては編集できません",
        deleteDisabledTooltip: "予約の割り当ては削除できません"
      },
      loading: "読み込み中...",
      setAvailability: "空き状況を設定",
      setAvailabilityFor: "{date}の空き状況を設定",
      noAvailabilityRecords: "空き状況の記録がありません",
      availabilityRecords: "空き状況の記録",
      calendar: "空き状況カレンダー",
      dateRange: "期間",
      startDate: "開始日",
      endDate: "終了日",
      status: "ステータス",
      currentStatus: "現在のステータス",
      notes: "メモ",
      actions: "アクション",
      notesPlaceholder: "この空き時間に関するコメントを追加",
      statusActive: "有効",
      statusInactive: "無効",
      statusMessage: "このドライバーは現在{date}まで{status}のため、予約に割り当てることができません。",
      availableMessage: "このドライバーは現在予約の割り当てが可能です。",
      upcomingSchedule: "今後のスケジュール",
      noUpcomingSchedule: "今後のスケジュール変更はありません。",
      returnsFromLeave: "休暇から復帰",
      viewFullSchedule: "全スケジュールを表示",
      statuses: {
        available: "対応可能",
        unavailable: "対応不可",
        leave: "休暇中",
        training: "研修中"
      },
      messages: {
        createSuccess: "空き期間が正常に作成されました",
        updateSuccess: "空き期間が正常に更新されました",
        deleteSuccess: "空き期間が正常に削除されました",
        createError: "空き期間の作成に失敗しました",
        updateError: "空き期間の更新に失敗しました",
        deleteError: "空き期間の削除に失敗しました"
      },
      returnMessage: "このドライバーは{date}に復帰します。",
      onBookingMessage: "このドライバーは現在{endTime}まで予約中です。"
    },
    vehicles: {
      title: "割り当て済み車両",
      description: "このドライバーに割り当てられている車両",
      noVehicles: "このドライバーに割り当てられている車両はありません"
    },
    upcomingBookings: {
      title: "今後の予約",
      description: "このドライバーのスケジュール済み予約",
      unassign: "割り当て解除",
      unassignSuccess: "予約の割り当てを解除しました",
      unassignSuccessDescription: "このドライバーから予約が削除されました。",
      unassignError: "予約の割り当て解除に失敗しました",
      empty: {
        title: "今後の予約はありません",
        description: "このドライバーには今後の予約がありません。"
      }
    },
    inspections: {
      empty: {
        title: "最近の点検はありません",
        description: "このドライバーは最近点検を行っていません。"
      }
    },
    currentStatus: {
      title: "現在のステータス"
    },
    keyInformation: {
      title: "主要情報"
    },
    tabs: {
      overview: "概要",
      availability: "空き状況",
      assignedVehicles: "割り当て済み車両",
      activityLog: "アクティビティログ"
    },
    recentActivity: {
      title: "最近のアクティビティ",
      description: "最新のアクティビティと割り当て"
    },
    activity: {
      empty: {
        title: "最近のアクティビティはありません",
        description: "このドライバーには表示する最近のアクティビティがありません。"
      }
    },
    pagination: {
      showing: "{total}件中{start}～{end}件を表示中",
    },
    errors: {
      loadFailed: {
        title: "ドライバーを読み込めませんでした",
        description: "ドライバーID {driverId} の詳細を取得できませんでした。再試行するか、問題が解決しない場合はサポートにお問い合わせください。"
      },
      consoleDriverIdError: "サーバーコンポーネントでドライバーIDが見つからないか、無効です。",
      consoleLoadError: "サーバーコンポーネントでID {driverId} のドライバーデータの読み込み中にエラーが発生しました："
    },
    messages: {
      refreshError: "ドライバーデータの更新に失敗しました",
      consoleRefreshError: "ドライバーデータの更新中にエラーが発生しました",
      couldNotSaveViewPreference: "表示設定を保存できませんでした",
      loadError: "ドライバーデータの読み込みに失敗しました",
      loadErrorDescription: "ドライバー情報を取得できませんでした。再試行してください。",
      noVehicleSelected: "車両が選択されていません",
      noVehicleSelectedDescription: "割り当てる車両を少なくとも1台選択してください。",
      noVehicleSelectedToUnassign: "割り当てを解除する車両を少なくとも1台選択してください。",
      assignSuccess: "車両が正常に割り当てられました",
      assignSuccessDescription: "車両がこのドライバーに割り当てられました。",
      multipleAssignSuccessDescription: "{count}台の車両がこのドライバーに割り当てられました。",
      assignError: "車両の割り当てに失敗しました",
      assignErrorDescription: "ドライバーに車両を割り当てられませんでした。再試行してください。",
      unassignSuccess: "車両の割り当てが正常に解除されました",
      unassignSuccessDescription: "このドライバーから車両の割り当てが解除されました。",
      multipleUnassignSuccessDescription: "{count}台の車両がこのドライバーから割り当て解除されました。",
      unassignError: "車両の割り当て解除に失敗しました",
      unassignErrorDescription: "ドライバーから車両の割り当てを解除できませんでした。再試行してください。"
    }
  },
  vehicles: {
    title: "車両",
    description: "車両フリートを管理します",
    addVehicle: "車両を追加",
    newVehicle: "新規車両",
    editVehicle: "車両を編集",
    backToVehicle: "車両に戻る",
    searchPlaceholder: "車両を検索...",
    noVehicles: "車両が見つかりません",
    filters: {
      search: "車両を検索",
      searchPlaceholder: "名前またはナンバープレートで検索",
      brand: "ブランドで絞り込み",
      model: "モデルで絞り込み",
      allBrands: "すべてのブランド",
      allModels: "すべてのモデル",
      noResults: "検索に一致する車両がありません",
      clearFilters: "フィルターをクリア"
    },
    pagination: {
      showing: "{total}台の車両のうち{start}～{end}台を表示中",
      loadMore: "さらに読み込む",
      page: "ページ {page}",
      of: "/ {total}"
    },
    fields: {
      name: "車両名",
      nameDescription: "この車両を識別するための分かりやすい名前",
      namePlaceholder: "例：ファミリーSUV",
      plateNumber: "ナンバープレート",
      plateNumberLabel: "ナンバープレート",
      brand: "ブランド",
      brandLabel: "ブランド",
      brandDescription: "車両のメーカー",
      brandPlaceholder: "例：トヨタ",
      model: "モデル",
      modelLabel: "モデル",
      modelPlaceholder: "例：カムリ",
      year: "年式",
      yearLabel: "年式",
      yearPlaceholder: "例：2024",
      vin: "車台番号(VIN)",
      vinLabel: "車台番号(VIN)",
      vinDescription: "17桁の車両識別番号",
      status: "ステータス",
      statusLabel: "ステータス",
      statusDescription: "車両の現在の運用状況",
      addedOnLabel: "追加日",
      passengerCapacityLabel: "乗車定員",
      luggageCapacityLabel: "荷物容量",
      nameLabel: "名前",
      image: "車両画像",
      imageDescription: "PNG, JPG, WEBP (最大800x400px)",
      modelDescription: "車両のモデル名",
      yearDescription: "製造年",
      plateNumberDescription: "車両登録番号",
      plateNumberPlaceholder: "例：品川300あ1234",
      statusPlaceholder: "車両ステータスを選択",
      statusActive: "稼働中",
      statusInactive: "非稼働",
      statusMaintenance: "メンテナンス中",
      uploadImage: "画像をアップロード",
      formCompletion: "フォーム入力状況",
      formCompletionDescription: "必須項目の進捗",
      vinPlaceholder: "17桁のVINを入力",
      uploadImageButton: "画像をアップロード",
      uploadImageDragText: "ここに画像をドラッグ＆ドロップするか、クリックして選択",
      uploadImageSizeLimit: "最大ファイルサイズ：5MB",
      type: "車両タイプ",
      luggageCapacity: "荷物容量",
      luggageCapacityDescription: "最大積載荷物数",
      luggageCapacityPlaceholder: "例：4",
      passengerCapacity: "乗車定員",
      passengerCapacityDescription: "最大乗客数",
      passengerCapacityPlaceholder: "例：8"
    },
    placeholders: {
      name: "車両名を入力",
      plateNumber: "ナンバープレート番号を入力",
      brand: "車両ブランドを入力",
      model: "車両モデルを入力",
      year: "製造年を入力",
      vin: "車両識別番号を入力"
    },
    form: {
      basicInfo: "基本情報",
      additionalInfo: "追加情報",
      imageUpload: "車両画像",
      uploadImageButton: "画像をアップロード",
      uploadImageDragText: "ここに画像をドラッグ＆ドロップするか、クリックして選択",
      uploadImageSizeLimit: "最大ファイルサイズ：5MB"
    },
    tabs: {
      info: "情報",
      history: "履歴",
      bookings: "予約",
      inspections: "点検",
      historyEmpty: "利用可能な履歴がありません",
      bookingsEmpty: "予約が見つかりません",
      inspectionsEmpty: "点検が見つかりません",
      allHistory: "すべての履歴",
      maintenanceHistory: "メンテナンス履歴",
      inspectionHistory: "点検履歴",
      bookingHistory: "予約履歴",
      filterBy: "絞り込み",
      allTypes: "すべてのタイプ",
      maintenance: "メンテナンス",
      inspection: "点検",
      booking: "予約",
      vehicleBookings: "車両予約",
      vehicleInspections: "車両点検",
      noBookingsForVehicle: "この車両の予約は見つかりません",
      noInspectionsForVehicle: "この車両の点検は見つかりません",
      dailyInspections: "日常点検",
      routineInspections: "定期点検"
    },
    messages: {
      createSuccess: "車両が正常に作成されました",
      updateSuccess: "車両が正常に更新されました",
      deleteSuccess: "車両が正常に削除されました",
      error: "エラーが発生しました",
      deleteError: "車両を削除できません",
      hasAssociatedRecords: "この車両には関連する点検またはメンテナンスタスクがあるため、削除できません",
      imageUploadError: "画像のアップロードに失敗しました",
      prefetchMileageError: "走行距離ログのプリフェッチに失敗しました",
      prefetchFuelError: "燃料ログのプリフェッチに失敗しました"
    },
    addNewTitle: "新規車両を追加",
    addNewDescription: "フリートに新しい車両を追加します",
    vehicleInformation: "車両情報",
    vehicleDetails: "車両詳細",
    vehicleStatus: "車両ステータス",
    basicInformation: "基本情報",
    specifications: "仕様",
    quickActions: "クイックアクション",
    actions: {
      viewAllHistory: "すべての履歴を表示",
      viewBookings: "予約を表示",
      viewInspections: "点検を表示",
      editVehicle: "車両を編集",
      viewDetails: "詳細を表示"
    },
    edit: {
      title: "車両を編集",
      description: "車両情報を更新します"
    },
    delete: {
      title: "車両を削除",
      description: "この操作は元に戻せません。これにより、車両が永久に削除され、サーバーから削除されます。"
    },
    schedule: {
      title: "今後のタスク",
      maintenanceTitle: "スケジュール済みメンテナンス",
      inspectionsTitle: "スケジュール済み点検",
      noUpcoming: "今後のタスクはありません",
      noMaintenanceTasks: "スケジュールされたメンテナンスタスクはありません",
      noInspections: "スケジュールされた点検はありません"
    },
    history: {
      title: "車両履歴",
      maintenanceTitle: "完了したメンテナンス",
      inspectionTitle: "完了した点検",
      noRecords: "履歴レコードが見つかりません",
      noMaintenanceRecords: "完了したメンテナンス記録はありません",
      noInspectionRecords: "完了した点検記録はありません",
      inspection: "点検",
      maintenance: "メンテナンス"
    },
    deleteDialog: {
      title: "車両を削除",
      description: "この操作は元に戻せません。これにより、車両が永久に削除され、サーバーから削除されます。"
    },
    inProgress: {
      title: "進行中のタスク",
      maintenanceTitle: "進行中のメンテナンス",
      inspectionsTitle: "進行中の点検",
      noTasks: "進行中のタスクはありません"
    },
    allVehicles: "すべての車両",
    status: {
      active: "稼働中",
      inactive: "非稼働",
      maintenance: "メンテナンス中"
    },
    noImage: "画像なし",
    detailsPage: {
      titleFallback: "車両詳細",
      descriptionFallback: "車両詳細の表示"
    }
  },
  maintenance: {
    title: "メンテナンス",
    description: "車両のメンテナンスタスクを管理します",
    addTask: "タスクを追加",
    newTask: "新規メンテナンスタスク",
    editTask: "メンテナンスタスクを編集",
    searchPlaceholder: "メンテナンスタスクを検索...",
    noTasks: "メンテナンスタスクが見つかりません",
    noTasksTitle: "メンテナンスタスクがありません",
    createImmediateTask: "即時タスクを作成",
    createImmediateTaskDescription: "定期的なスケジュールに加えて、タスクをすぐに作成します",
    recurringTask: "定期タスク",
    oneTime: "一回限りのタスク",
    isRecurring: "これを定期的なメンテナンスにする",
    isRecurringDescription: "このメンテナンスを定期的に繰り返すようにスケジュールします",
    form: {
      description: "以下のフォームに入力して、新しいメンテナンスタスクを作成します",
      basicInfo: "基本情報",
      scheduleInfo: "スケジュール",
      additionalDetails: "詳細",
      stepOneTitle: "基本情報を入力",
      stepOneDescription: "テンプレートを選択（オプション）し、基本的なタスク情報を入力して開始します。",
      stepTwoTitle: "スケジュールを設定",
      stepTwoDescription: "このタスクを繰り返す頻度と開始時期を定義します。",
      stepThreeTitle: "詳細を追加",
      stepThreeDescription: "このメンテナンスタスクに関する追加の詳細を提供します。"
    },
    schedule: {
      title: "メンテナンスをスケジュール",
      details: "新しいメンテナンスタスクをスケジュールします",
      description: "車両のメンテナンスタスクを作成します",
      button: "スケジュール",
      id: "スケジュールID"
    },
    createDirect: "タスクを作成",
    status: {
      pending: "保留中",
      scheduled: "スケジュール済み",
      in_progress: "進行中",
      completed: "完了",
      cancelled: "キャンセル済み"
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
      templateInfo: "迅速なタスク作成",
      templateInfoDescription: "定義済みのタスクテンプレートを選択して、標準的な期間とコストで一般的なメンテナンスタスクをすばやく入力します。",
      templateApplied: "テンプレートが適用されました",
      templateAppliedDescription: "テンプレートが適用されました。必要に応じてタスクの詳細をカスタマイズできます。"
    },
    fields: {
      title: "タスク名",
      titlePlaceholder: "例：オイル交換",
      titleDescription: "メンテナンス作業の分かりやすい名称",
      description: "説明",
      descriptionPlaceholder: "例：定期オイル交換とフィルター交換",
      descriptionDescription: "メンテナンス作業の詳細な説明",
      vehicle: "車両",
      vehicleDescription: "このメンテナンス作業の対象車両を選択",
      dueDate: "期日",
      dueDateDescription: "この作業を完了すべき日時",
      priority: "優先度",
      priorityDescription: "作業の優先度レベル",
      status: "ステータス",
      statusDescription: "作業の現在のステータス",
      estimatedDuration: "推定所要時間（時間）",
      estimatedDurationPlaceholder: "例：2",
      estimatedDurationDescription: "作業完了までに予想される時間（時間単位）",
      cost: "推定費用",
      costDescription: "メンテナンスにかかる予想費用",
      estimatedCost: "推定費用",
      estimatedCostPlaceholder: "例：150.00",
      estimatedCostDescription: "このメンテナンス作業にかかる予想費用",
      selectVehicle: "車両を選択",
      selectVehiclePlaceholder: "車両を選択してください",
      notes: "追加メモ",
      notesPlaceholder: "追加のメモや要件を入力",
      notesDescription: "メンテナンス作業に関する追加情報",
      dueDatePlaceholder: "日付を選択"
    },
    details: {
      taskDetails: "タスク詳細",
      vehicleDetails: "車両詳細",
      vehicleInfo: {
        noImage: "画像がありません"
      },
      scheduledFor: "{date}期日",
      estimatedCompletion: "推定完了時間：{duration}時間",
      estimatedCost: "推定費用：${cost}",
      assignedVehicle: "割り当て車両",
      taskHistory: "タスク履歴",
      noHistory: "履歴がありません",
      taskProgress: "タスク進捗",
      hours: "時間",
      overdueDays: "{days}日期限切れ",
      daysUntilDue: "期日まであと{days}日",
      recommendations: "メンテナンス推奨事項",
      recommendationItems: {
        checkRelated: "関連システムの確認",
        checkRelatedDesc: "このメンテナンス作業中に関連する車両システムの点検を検討してください。",
        trackCosts: "メンテナンス費用の追跡",
        trackCostsDesc: "将来の参照のために、このメンテナンスに関連するすべての費用を記録してください。"
      },
      progressStatus: {
        completed: "このタスクは完了しました。",
        inProgress: "このタスクは現在進行中です。",
        scheduled: "このタスクはスケジュールされており、保留中です。",
        overdue: "このタスクは期限切れであり、対応が必要です。"
      }
    },
    messages: {
      createSuccess: "メンテナンスタスクが正常に作成されました",
      createSuccessDescription: "新しいメンテナンスタスクが追加されました。",
      updateSuccess: "メンテナンスタスクが正常に更新されました",
      updateSuccessDescription: "メンテナンスタスクの詳細が更新されました。",
      deleteSuccess: "メンテナンスタスクが正常に削除されました",
      taskStarted: "メンテナンスタスクが開始されました",
      error: "エラーが発生しました",
      createErrorDescription: "メンテナンスタスクの作成中に問題が発生しました。もう一度お試しください。",
      immediateTaskError: "即時タスクの作成中にエラーが発生しました",
      nextTaskCreated: "次の定期タスクが作成されました",
      nextTaskScheduled: "{date}に次のタスクがスケジュールされました"
    },
    actions: {
      markComplete: "完了としてマーク",
      markInProgress: "進行中としてマーク",
      startTask: "タスクを開始",
      cancel: "タスクをキャンセル",
      edit: "タスクを編集",
      delete: "タスクを削除"
    }
  },
  inspections: {
    title: "点検",
    description: "車両点検を管理・追跡します。",
    searchPlaceholder: "車両またはタイプで点検を検索...",
    createInspection: "点検を作成",
    createNewInspection: "新規点検を作成",
    createNewInspectionDescription: "詳細を入力して新しい点検記録を作成します。",
    viewDetails: "詳細を表示",
    performInspection: "点検を実施",
    noInspections: "点検が見つかりません。",
    addNew: "新しい点検を追加して開始します。",
    unnamedInspection: "無名の点検",
    noVehicle: "車両が割り当てられていません",
    noVehicleAssigned: "車両が割り当てられていません",
    overallNotes: "総合メモ",
    selectDate: "期間を選択",
    groupBy: "グループ化",
    defaultType: "定期",
    typeLabel: "タイプ",
    statusLabel: "ステータス",
    inspectorLabel: "点検員",
    inspectorEmailLabel: "点検員のメールアドレス",
    groupByOptions: {
      date: "日付",
      vehicle: "車両",
      none: "なし"
    },
    quickStats: {
      title: "点検概要",
      todaysInspections: "本日の点検",
      pendingInspections: "保留中の点検",
      weeklyCompleted: "今週完了した点検",
      failedInspections: "不合格の点検",
      totalInspections: "総点検数",
      averageCompletionTime: "平均完了時間",
      passRate: "合格率",
      upcomingInspections: "今後の点検"
    },
    calendar: {
      title: "点検カレンダー",
      viewMode: "表示モード",
      month: "月",
      week: "週",
      day: "日",
      today: "今日",
      previousMonth: "前の月",
      nextMonth: "次の月",
      previousWeek: "前の週",
      nextWeek: "次の週",
      previousDay: "前日",
      nextDay: "翌日",
      noInspectionsOnDate: "この日にスケジュールされた点検はありません",
      inspectionsOnDate: "{date}に{count}件の点検",
      scheduleInspection: "点検をスケジュール",
      viewInspection: "点検を表示"
    },
    status: {
      pending: "保留中",
      inProgress: "進行中",
      in_progress: "進行中",
      completed: "完了",
      failed: "不合格",
      scheduled: "スケジュール済み",
      cancelled: "キャンセル済み"
    },
    type: {
      routine: "定期点検",
      safety: "安全点検",
      maintenance: "整備点検",
      daily: "日常点検",
      test: "テスト点検",
      unspecified: "未指定",
      daily_checklist_toyota: "日常チェックリスト（トヨタ）",
      "Daily Checklist Toyota": "日常チェックリスト（トヨタ）",
      daily_checklist_mercedes: "日常チェックリスト（メルセデス）",
      "Daily Checklist Mercedes": "日常チェックリスト（メルセデス）",
      description: {
        routine: "車両システムの包括的なチェック。",
        safety: "安全上重要なコンポーネントの集中チェック。",
        maintenance: "詳細な機械システムの点検。",
        daily: "必須コンポーネントの簡単な日常点検。",
        test: "開発およびトレーニング目的のテスト点検テンプレート。"
      }
    },
    typeValues: {
      routine: "定期点検",
      safety: "安全点検",
      maintenance: "整備点検",
      daily: "日常点検",
      unspecified: "未指定",
      daily_checklist_toyota: "日常チェックリスト（トヨタ）",
      daily_checklist_mercedes: "日常チェックリスト（メルセデス）"
    },
    statusValues: {
      pass: "合格",
      fail: "不合格",
      pending: "保留中",
      inProgress: "進行中",
      completed: "完了",
      failed: "不合格",
      scheduled: "スケジュール済み",
      cancelled: "キャンセル済み"
    },
    fields: {
      vehicle: "車両",
      selectVehiclePlaceholder: "車両を選択",
      date: "日付",
      type: "タイプ",
      status: "ステータス",
      inspector: "点検員",
      inspectorEmail: "点検員のメールアドレス",
      notes: "メモ",
      notesPlaceholder: "この項目に関するメモを追加...",
      photos: "写真",
      photo: "写真"
    },
    notifications: {
      createSuccess: "点検が正常に作成されました。",
      createError: "点検の作成に失敗しました。",
      updateSuccess: "点検が正常に更新されました。",
      updateError: "点検の更新に失敗しました。",
      deleteSuccess: "点検が正常に削除されました。",
      deleteError: "点検の削除に失敗しました。"
    },
    meta: {
      createTitle: "点検を作成",
      createDescription: "新しい車両点検を作成します。"
    },
    dateGroup: {
      today: "今日",
      yesterday: "昨日",
      thisWeek: "今週",
      thisMonth: "今月",
      upcoming: "予定",
      older: "過去"
    },
    stats: {
      count: "{{count}}件の点検",
      vehicleCount: "{{count}}件の点検"
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
      showingVehicles: "{{total}}台の車両のうち{{start}}-{{end}}台を表示中"
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
      completeInspection: "点検を完了",
      takePhoto: "写真を撮る",
      photos: "{{count}}枚の写真",
      needsRepair: "修理が必要な項目",
      scheduleRepair: "修理をスケジュール",
      scheduleRepairDescription: "不合格項目に対してメンテナンスタスクを作成します",
      start: "開始",
      continueEditing: "編集を続ける",
      markAsCompleted: "完了としてマーク",
      printReport: "レポートを印刷",
      exportHtml: "HTMLをエクスポート",
      exportPdf: "PDFをエクスポート"
    },
    templateDuplicated: "テンプレートが正常に複製されました",
    templateDeleted: "テンプレートが正常に削除されました",
    searchTemplates: "テンプレートを検索...",
    manageAssignments: "割り当てを管理",
    addSection: "セクションを追加",
    editSection: "セクションを編集",
    addItem: "項目を追加",
    editItem: "項目を編集",
    items: "項目",
    sectionAdded: "セクションが正常に追加されました",
    sectionUpdated: "セクションが正常に更新されました",
    sectionDeleted: "セクションが正常に削除されました",
    itemAdded: "項目が正常に追加されました",
    itemUpdated: "項目が正常に更新されました",
    itemDeleted: "項目が正常に削除されました",
    templateUpdated: "テンプレートが正常に更新されました",
    requiresPhoto: "写真必須",
    requiresNotes: "メモ必須",
    noSections: "セクションが見つかりません",
    createFirstSection: "最初のセクションを作成して開始してください",
    adjustFilters: "検索またはフィルターを調整してみてください",
    templateManager: {
      routineTemplateTitle: "定期点検テンプレート",
      safetyTemplateTitle: "安全点検テンプレート",
      maintenanceTemplateTitle: "整備点検テンプレート",
      dailyTemplateTitle: "日常チェックリストテンプレート",
      testTemplateTitle: "テスト点検テンプレート",
      description: "点検テンプレートのセクションと項目を管理します"
    },
    confirmDeleteTemplate: "このテンプレート全体を削除してもよろしいですか？この操作は元に戻せません。",
    confirmDeleteSection: "このセクションを削除してもよろしいですか？この操作は元に戻せません。",
    confirmDeleteItem: "この項目を削除してもよろしいですか？この操作は元に戻せません。",
    templateInstanceCreated: "テンプレートインスタンスが正常に作成されました",
    sections: {
      vehicle: "車両情報",
      inspection: "点検情報",
      summary: "概要",
      items: "点検項目",
      steering_system: {
        title: "ステアリングシステム",
        items: {
          steering_wheel: { title: "ステアリングホイール", description: "ステアリングホイールの状態と遊びを確認します。" },
          power_steering: { title: "パワーステアリング", description: "パワーステアリングフルードと動作を確認します。" },
          steering_column: { title: "ステアリングコラム", description: "ステアリングコラムの緩みを点検します。" }
        }
      },
      brake_system: {
        title: "ブレーキシステム",
        items: {
          brake_pedal: { title: "ブレーキペダル", description: "ブレーキペダルの感触と踏みしろを確認します。" },
          brake_discs: { title: "ブレーキディスク/パッド", description: "ブレーキディスクとパッドの摩耗を点検します。" },
          brake_fluid: { title: "ブレーキフルード", description: "ブレーキフルードの量と状態を確認します。" },
          brake_oil: { title: "ブレーキオイル", description: "ブレーキオイルの量と状態を確認します。" },
          braking_condition: { title: "ブレーキの効き具合", description: "全体的なブレーキ性能をテストします。" }
        }
      },
      suspension: {
        title: "サスペンションシステム",
        items: {
          shock_absorbers: { title: "ショックアブソーバー", description: "ショックアブソーバーの漏れや損傷を点検します。" },
          springs: { title: "スプリング", description: "サスペンションスプリングの損傷やへたりを点検します。" },
          bushings: { title: "ブッシュ", description: "サスペンションブッシュの摩耗や損傷を点検します。" },
          ball_joints: { title: "ボールジョイント", description: "ボールジョイントの摩耗や遊びを点検します。" }
        }
      },
      lighting: {
        title: "灯火装置",
        items: {
          headlights: { title: "ヘッドライト", description: "ヘッドライトの動作と光軸を確認します。" },
          taillights: { title: "テールライト", description: "テールライトとブレーキライトの動作を確認します。" },
          turn_indicators: { title: "方向指示器", description: "すべての方向指示器とハザードランプの動作を確認します。" },
          reverse_lights: { title: "後退灯", description: "後退灯の動作を確認します。" },
          brake_lights: { title: "ブレーキランプ", description: "ブレーキランプの動作を確認します。" },
          hazard_lights: { title: "ハザードランプ", description: "ハザードランプの動作を確認します。" }
        }
      },
      engine: {
        title: "エンジン",
        items: {
          oil_level: { title: "オイルレベル", description: "エンジンオイルの量と状態を確認します。" },
          coolant_level: { title: "冷却水レベル", description: "エンジン冷却水の量と状態を確認します。" },
          belts: { title: "ベルト", description: "エンジンベルトの摩耗と張りを点検します。" },
          drive_belts: { title: "駆動ベルト", description: "駆動ベルトの摩耗と張りを点検します。" },
          hoses: { title: "ホース", description: "エンジンホースの漏れや損傷を点検します。" },
          fluid_leaks: { title: "液体漏れ", description: "エンジンからの液体漏れを確認します。" },
          engine_oil: { title: "エンジンオイル", description: "エンジンオイルの量と品質を確認します。" },
          radiator_coolant: { title: "ラジエーター冷却水", description: "ラジエーター冷却水の量と状態を確認します。" },
          engine_starting_condition: { title: "エンジン始動状態", description: "エンジンが正しく始動し、スムーズに作動することを確認します。" }
        }
      },
      transmission: {
        title: "トランスミッション",
        items: {
          transmission_fluid: { title: "トランスミッションフルード", description: "トランスミッションフルードの量と状態を確認します。" },
          shifting_operation: { title: "シフト操作", description: "スムーズなシフトチェンジができるかテストします。" },
          clutch_operation: { title: "クラッチ操作", description: "クラッチのエンゲージメントと操作を確認します（該当する場合）。" },
          leaks: { title: "漏れ", description: "トランスミッションからの液体漏れを確認します。" }
        }
      },
      electrical: {
        title: "電気系統",
        items: {
          battery_condition: { title: "バッテリー状態", description: "バッテリー端子と全体の状態を点検します。" },
          alternator_output: { title: "オルタネーター出力", description: "オルタネーターの充電電圧を確認します。" },
          starter_operation: { title: "スターター操作", description: "スターターモーターの動作をテストします。" }
        }
      },
      safety_equipment: {
        title: "安全装備",
        items: {
          seatbelt_operation: { title: "シートベルト操作", description: "すべてのシートベルトが正常に機能し、状態が良いか確認します。" },
          airbag_system: { title: "エアバッグシステム", description: "エアバッグ警告灯の状態を確認します（アクティブな障害なし）。" },
          wiper_operation: { title: "ワイパー操作", description: "フロントガラスワイパーとウォッシャー液の動作をテストします。" }
        }
      },
      brake_safety: {
        title: "ブレーキの安全性",
        items: {
          emergency_brake: { title: "緊急ブレーキ", description: "緊急ブレーキの操作をテストします。" },
          brake_lines: { title: "ブレーキライン", description: "ブレーキラインの漏れや損傷を点検します。" },
          abs_system: { title: "ABSシステム", description: "ABS警告灯の状態を確認します。" }
        }
      },
      scheduled_maintenance: {
        title: "定期メンテナンス",
        items: {
          oil_change: { title: "オイル交換", description: "前回のオイル交換と次回の予定を確認します。" },
          filter_replacement: { title: "フィルター交換", description: "エア、オイル、燃料フィルターを確認します。" },
          fluid_levels: { title: "フルードレベル", description: "すべての重要なフルードレベルを確認します。" }
        }
      },
      wear_items: {
        title: "消耗品",
        items: {
          brake_pads: { title: "ブレーキパッド", description: "ブレーキパッドの厚さを点検します。" },
          tire_rotation: { title: "タイヤローテーション", description: "前回のタイヤローテーションと次回の予定を確認します。" },
          belt_condition: { title: "ベルトの状態", description: "サーペンタインベルトやその他のベルトの状態を確認します。" }
        }
      },
      visibility: {
        title: "視界",
        items: {
          windshield_condition: { title: "フロントガラスの状態", description: "フロントガラスにひびや欠けがないか点検します。" },
          mirror_condition: { title: "ミラーの状態", description: "すべてのミラーの状態と調整を確認します。" },
          window_operation: { title: "窓の操作", description: "すべての窓の操作をテストします。" }
        }
      },
      restraint_systems: {
        title: "拘束装置",
        items: {
          seatbelt_condition: { title: "シートベルトの状態", description: "シートベルトのウェビングとバックルを点検します。" },
          airbag_indicators: { title: "エアバッグインジケーター", description: "エアバッグ警告灯の状態を確認します。" },
          child_locks: { title: "チャイルドロック", description: "チャイルドセーフティロックの操作をテストします。" }
        }
      },
      diagnostics: {
        title: "診断",
        items: {
          computer_scan: { title: "コンピュータースキャン", description: "エラーコードの診断コンピュータースキャンを実行します。" },
          sensor_check: { title: "センサーチェック", description: "主要なセンサーの動作を確認します。" },
          emissions_test: { title: "排出ガステスト", description: "排出ガスシステムのコンポーネントを確認します（該当する場合）。" }
        }
      },
      exterior: {
        title: "外装状態",
        items: {
          dirt_and_damage: { title: "汚れと損傷", description: "車両の外装に汚れの蓄積や物理的な損傷がないか点検します。" },
          cracks_and_damage: { title: "ひび割れと損傷", description: "車両のボディにひび割れ、へこみ、その他の構造的損傷がないか点検します。" }
        }
      },
      other: { title: "その他" },
      tires: {
        title: "タイヤ",
        items: {
          tire_pressure: {
            title: "タイヤ空気圧",
            description: "タイヤ空気圧を推奨レベルに確認・調整します。"
          },
          tread_depth: {
            title: "トレッドの深さ",
            description: "タイヤのトレッドの深さを測定して、十分なグリップを確保します。"
          },
          wear_pattern: {
            title: "摩耗パターン",
            description: "タイヤに不均一な摩耗パターンがないか点検します。"
          }
        }
      },
    },
    messages: {
      saveSuccess: "点検が正常に保存されました",
      saveError: "点検の保存中にエラーが発生しました",
      exportSuccess: "点検が正常にエクスポートされました",
      exportError: "点検のエクスポート中にエラーが発生しました",
      completeSuccess: "点検が完了としてマークされました",
      completeError: "点検の完了中にエラーが発生しました",
      printStarted: "印刷が開始されました",
      errorLoadingTemplate: "点検テンプレートの読み込み中にエラーが発生しました",
      defaultRepairDescription: "点検で不合格となった項目の修理タスク。",
      unknownItem: "不明な項目",
      repairNeededFor: "修理が必要な項目",
      andMoreItems: "および他{count}項目",
      pdfDownloaded: "PDFが正常にダウンロードされました",
      csvDownloaded: "CSVが正常にダウンロードされました",
      submitSuccessTitle: "点検が送信されました",
      submitSuccessDescription: "点検結果が正常に送信されました。",
      submitErrorTitle: "送信に失敗しました",
      genericSubmitError: "点検の送信中にエラーが発生しました。もう一度お試しください。"
    },
    errors: {
      selectVehicle: "車両を選択してください",
      completeOneItem: "少なくとも1つの項目を完了してください",
      completeOneItemBeforeSubmit: "送信する前に少なくとも1つの項目を完了してください",
      authError: "認証エラー",
      mustBeLoggedIn: "点検を送信するにはログインする必要があります",
      storageAccessError: "ストレージアクセスエラー",
      unableToAccessStorage: "ストレージシステムにアクセスできません",
      creatingInspectionError: "点検の作成中にエラーが発生しました",
      updatingInspectionError: "点検の更新中にエラーが発生しました",
      photoUploadFailed: "写真のアップロードに失敗しました",
      noCompletedItems: "完了した項目がありません",
      genericSubmitError: "エラーが発生しました。もう一度お試しください。"
    },
    details: {
      title: "点検詳細",
      printTitle: "点検レポート",
      scheduledFor: "{date}にスケジュール済み",
      inspectionItems: "点検項目",
      vehicleInfoTitle: "車両情報",
      overviewTitle: "点検概要",
      summaryTitle: "点検サマリー",
      summaryPassed: "合格項目",
      summaryFailed: "不合格項目",
      summaryNotes: "メモ付き項目",
      summaryPhotos: "撮影された写真",
      passRate: "合格率",
      attentionRequired: "対応が必要です",
      itemsNeedAttention: "{count}項目が対応を必要としています",
      allItemsTitle: "全点検項目 ({count})",
      failedItemsTitle: "不合格項目 ({count})",
      passedItemsTitle: "合格項目 ({count})",
      repairNeededTitle: "修理が必要な項目",
      repairNeededDescription: "以下の項目が点検で不合格となり、対応が必要です。以下をクリックしてメンテナンスタスクをスケジュールしてください。",
      repairTaskTitle: "{inspectionName} ({vehicleName}) の点検後修理",
      photosTitle: "写真 ({count})",
      photosTabDescription: "この点検中に撮影されたすべての写真を表示します。",
      noPhotosMessage: "この点検では写真が撮影されませんでした。",
      viewPhotoAria: "{itemName}の写真を表示",
      photoItemAlt: "{itemName}の写真",
      inspectionInfo: {
        title: "点検情報"
      },
      summary: {
        title: "概要",
        passedItems: "合格項目",
        failedItems: "不合格項目",
        itemsWithNotes: "メモ付き項目",
        photosTaken: "撮影された写真"
      },
      items: {
        title: "点検項目",
        itemHeader: "項目",
        statusHeader: "ステータス",
        notesHeader: "メモ"
      },
      pdfFooter: {
        generatedOn: "{date}に生成",
        vehicleName: "車両：{name}"
      },
      vehicleInfo: {
        title: "車両情報",
        plateNumber: "ナンバープレート",
        brand: "ブランド",
        model: "モデル",
        year: "年式",
        noImage: "画像がありません"
      },
      inspector: {
        title: "点検員",
        name: "点検員名",
        email: "点検員メール"
      },
      results: {
        title: "点検概要",
        passedLabel: "合格項目",
        failedLabel: "不合格項目",
        notesLabel: "メモ付き項目",
        photosLabel: "撮影された写真",
        passCount: "合格項目: {count}",
        failCount: "不合格項目: {count}",
        notesCount: "追加されたメモ: {count}",
        photoCount: "撮影された写真: {count}",
        completionRate: "完了率",
        lastUpdated: "最終更新",
        failedItemsFound: "不合格項目が見つかりました",
        failedItemsDescription: "以下の項目は点検基準を満たしていませんでした。",
        allPassed: "すべての項目が合格しました",
        noFailedItems: "この点検で不合格の項目は見つかりませんでした。",
        noItemsInStatus: "{status}ステータスの項目は見つかりませんでした",
        noPassedItems: "合格項目は見つかりませんでした",
        noPendingItems: "保留中の項目は見つかりませんでした"
      },
      tabs: {
        details: "詳細",
        failed: "不合格項目",
        passed: "合格項目",
        photos: "写真",
        notes: "メモ"
      },
      photosModal: {
        altText: "点検写真 {index}",
        downloadPhoto: "写真をダウンロード",
        counter: "{total} 中 {current}"
      },
      notes: {
        title: "総合点検メモ"
      },
      dateLabel: "点検日",
      isScheduled: "スケジュール済み",
      isScheduledDescription: "点検が定期スケジュールの一部であるかを示します。",
      overallNotes: "総合メモ",
      overallNotesPlaceholder: "点検に関する総合的なメモを入力..."
    },
    dateLabel: "点検日",
    templates: {
      title: "点検テンプレート",
      itemNameLabel: "項目名",
      addItem: "項目を追加",
      deleteSectionConfirm: "このセクションを削除してもよろしいですか？",
      requiresPhoto: "写真必須",
      requiresNotes: "メモ必須",
      deleteItemConfirm: "この項目を削除してもよろしいですか？",
      newItemTitle: "新しい点検項目を追加",
      newItemDescription: "この点検セクションに新しい項目を追加します",
      itemNamePlaceholder: "項目名を入力",
      itemNamePlaceholderJa: "項目名を入力（日本語）",
      itemDescriptionLabel: "項目の説明",
      itemDescriptionPlaceholder: "項目の説明を入力",
      itemDescriptionPlaceholderJa: "項目の説明を入力（日本語）",
      editSectionTitle: "セクションを編集",
      editSectionDescription: "セクション情報を更新します",
      sectionNameLabel: "セクション名",
      sectionDescriptionLabel: "セクションの説明",
      editItemTitle: "点検項目を編集",
      editItemDescription: "点検項目の詳細を更新します",
      manageTitle: "{type}テンプレートを管理",
      managerDescription: "{type}点検テンプレートを設定およびカスタマイズします。セクションと項目を追加して、点検プロセスを効率化します。",
      managementSummary: "{count}セクションが設定済み",
      noSectionsConfigured: "まだセクションが設定されていません",
      emptyStateDescription: "このテンプレートにはまだセクションがありません。セクションは点検項目を整理し、プロセスをより効率的にするのに役立ちます。",
      emptyStateNote: "このテンプレートを設定するには、管理者に連絡してください。",
      addSection: "セクションを追加",
      newSectionTitle: "新しいセクションを追加",
      newSectionDescription: "この点検テンプレートに新しいセクションを作成します",
      sectionNamePlaceholder: "セクション名を入力",
      sectionNamePlaceholderJa: "セクション名を入力（日本語）",
      sectionDescriptionPlaceholder: "セクションの説明を入力",
      sectionDescriptionPlaceholderJa: "セクションの説明を入力（日本語）",
      noSections: "セクションが見つかりません。セクションを追加して開始してください。",
      addItemError: "点検項目の追加中にエラーが発生しました",
      addSectionSuccess: "セクションが正常に追加されました",
      addSectionError: "セクションの追加中にエラーが発生しました",
      editSectionSuccess: "セクションが正常に更新されました",
      editSectionError: "セクションの更新中にエラーが発生しました",
      deleteSectionSuccess: "セクションが正常に削除されました",
      deleteSectionError: "セクションの削除中にエラーが発生しました",
      deleteSectionErrorNotEmpty: "項目を含むセクションは削除できません",
      addItemSuccess: "項目が正常に追加されました",
      editItemSuccess: "項目が正常に更新されました",
      editItemError: "項目の更新中にエラーが発生しました",
      deleteItemSuccess: "項目が正常に削除されました",
      deleteItemError: "項目の削除中にエラーが発生しました",
      deleteItemErrorInUse: "点検で使用されている項目は削除できません",
      itemNameRequired: "少なくとも1つの言語で項目名が必要です",
      sectionNameRequired: "少なくとも1つの言語でセクション名が必要です",
      itemNotFound: "項目が見つかりません",
      assign: "割り当て",
      tabs: {
        templates: "テンプレート",
        assignments: "割り当て"
      },
      assignments: {
        title: "テンプレートの割り当て",
        description: "特定の点検テンプレートを使用する車両とグループを管理します",
        templateDescription: "{template}点検テンプレートを使用する車両とグループを設定します",
        assignTemplateTitle: "{template}テンプレートを割り当て",
        assignTemplateDescription: "点検に{template}テンプレートを使用する車両と車両グループを選択します",
        manage: "割り当てを管理",
        assignedCount: "{count}件の割り当て",
        notAssigned: "どの車両またはグループにも割り当てられていません",
        selectVehicles: "車両を選択",
        selectVehiclesPlaceholder: "車両を選択...",
        vehiclesHelpText: "このテンプレートを使用する個々の車両を選択します",
        selectGroups: "車両グループを選択",
        selectGroupsPlaceholder: "車両グループを選択...",
        groupsHelpText: "車両グループを選択します - これらのグループ内のすべての車両がこのテンプレートを使用します",
        assignedVehicles: "割り当て済み車両",
        assignedGroups: "割り当て済み車両グループ",
        saveSuccess: "テンプレートの割り当てが正常に保存されました",
        saveError: "テンプレートの割り当ての保存に失敗しました"
      },
      activation: {
        title: "テンプレートの有効化",
        activate: "テンプレートを有効化",
        deactivate: "テンプレートを無効化",
        activateConfirm: "このテンプレートを有効にしてもよろしいですか？",
        deactivateConfirm: "このテンプレートを無効にしてもよろしいですか？",
        activateSuccess: "テンプレートが正常に有効化されました",
        deactivateSuccess: "テンプレートが正常に無効化されました",
        activateError: "テンプレートの有効化中にエラーが発生しました",
        deactivateError: "テンプレートの無効化中にエラーが発生しました",
        status: "ステータス",
        active: "有効",
        inactive: "無効",
        activeDescription: "このテンプレートは現在有効であり、使用可能です",
        inactiveDescription: "このテンプレートは現在無効であり、ユーザーから非表示になっています"
      },
      vehicleAssignment: {
        title: "車両の割り当て",
        description: "このテンプレートを特定の車両または車両グループに割り当てます",
        assignToAll: "すべての車両で利用可能",
        assignToGroup: "車両グループに割り当て",
        assignToVehicles: "特定の車両に割り当て",
        selectGroup: "車両グループを選択",
        selectVehicles: "車両を選択",
        noGroupsFound: "車両グループが見つかりません",
        noVehiclesFound: "車両が見つかりません",
        createGroup: "車両グループを作成",
        manageGroups: "車両グループを管理",
        assignmentType: "割り当てタイプ",
        currentAssignments: "現在の割り当て",
        noAssignments: "どの車両またはグループにも割り当てられていません",
        assignSuccess: "テンプレートが正常に割り当てられました",
        assignError: "テンプレートの割り当て中にエラーが発生しました",
        unassignSuccess: "テンプレートの割り当てが正常に解除されました",
        unassignError: "テンプレートの割り当て解除中にエラーが発生しました"
      },
      vehicleGroups: {
        title: "車両グループ",
        description: "テンプレート管理を容易にするために車両をグループに整理します",
        create: "車両グループを作成",
        edit: "車両グループを編集",
        delete: "車両グループを削除",
        name: "グループ名",
        nameDescription: "この車両グループの分かりやすい名前",
        namePlaceholder: "例：セダンフリート、配送トラック",
        groupDescription: "説明",
        descriptionPlaceholder: "このグループの説明を入力",
        color: "色",
        colorDescription: "このグループを識別するための色を選択します",
        vehicles: "車両",
        vehicleCount: "{count}台の車両",
        noVehicles: "このグループに車両はありません",
        addVehicles: "車両を追加",
        removeVehicle: "グループから削除",
        createSuccess: "車両グループが正常に作成されました",
        updateSuccess: "車両グループが正常に更新されました",
        deleteSuccess: "車両グループが正常に削除されました",
        createError: "車両グループの作成中にエラーが発生しました",
        updateError: "車両グループの更新中にエラーが発生しました",
        deleteError: "車両グループの削除中にエラーが発生しました",
        deleteConfirm: "この車両グループを削除してもよろしいですか？",
        deleteWarning: "これにより、すべての車両からグループの割り当てが削除されますが、車両自体は削除されません。",
        assignVehicles: "グループに車両を割り当て",
        unassignVehicle: "グループから車両を削除",
        groupAssignments: "グループ割り当て",
        moveToGroup: "グループに移動",
        ungrouped: "グループ化されていない車両"
      },
      copyTemplate: {
        title: "テンプレートをコピー",
        description: "特定の車両またはグループ用にこのテンプレートのコピーを作成します",
        copyForGroup: "車両グループ用にコピー",
        copyForVehicle: "特定の車両用にコピー",
        selectTarget: "ターゲットを選択",
        copySuccess: "テンプレートが正常にコピーされました",
        copyError: "テンプレートのコピー中にエラーが発生しました",
        customizeAfterCopy: "選択したターゲット用にこのテンプレートをカスタマイズできます"
      },
      masterTemplate: {
        title: "マスターテンプレート",
        description: "これはコピーしてカスタマイズできるマスターテンプレートです",
        isMaster: "マスターテンプレート",
        basedOn: "ベース：{templateName}",
        viewMaster: "マスターテンプレートを表示",
        customizedFor: "カスタマイズ対象：{target}"
      }
    },
    photoForItem: "{itemName}の写真"
  },
  dashboard: {
      title: "ダッシュボード",
      description: "車両フリートの概要",
      quickActions: {
        title: "クイックアクション",
        description: "一般的なタスクとアクション",
        addVehicle: "車両を追加",
        scheduleMaintenance: "メンテナンスをスケジュール",
        scheduleInspection: "点検を作成",
        createQuotation: "見積を作成",
        viewReports: "レポートを表示"
      },
      expiringQuotations: {
        title: "期限切れ間近の見積",
        description: "今後7日以内に期限切れになる見積。",
        amount: "金額",
        expiringTomorrow: "明日期限切れ",
        expiringInDays: "{days}日後に期限切れ",
        viewAll: "すべての期限切れ間近の見積を表示"
      },
      activityFeed: {
        title: "アクティビティフィード",
        description: "最近および今後のアクティビティ",
        noUpcoming: "今後のアクティビティはありません",
        noRecent: "最近のアクティビティはありません",
        viewAll: "すべてのアクティビティを表示"
      },
      dailyChecklist: {
        title: "日常チェックリスト",
        description: "今日完了するタスク",
        completeChecklist: "チェックリストを完了",
        checkAllItems: "すべての項目をチェックして完了",
        upcomingReminders: "今後のリマインダー",
        completed: {
          title: "チェックリスト完了！",
          message: "お疲れ様でした！すべての日次チェックを完了しました。また明日！",
          reset: "チェックリストをリセット"
        },
        items: {
          checkTires: "タイヤの空気圧と状態を確認",
          checkLights: "すべてのライトが機能することを確認",
          checkFluids: "オイルと冷却水のレベルを確認",
          checkBrakes: "ブレーキとパーキングブレーキをテスト",
          visualInspection: "目視点検を実施"
        }
      },
      vehicleStats: {
        title: "車両概要",
        description: "車両に関するクイック統計",
        fuelLevel: "燃料レベル",
        mileage: "走行距離",
        viewAllVehicles: "すべての車両を表示",
        previousVehicle: "前の車両",
        nextVehicle: "次の車両"
      },
      upcomingBookings: {
        title: "今後の予約",
        description: "レビューと割り当て待ちの予約",
        viewAll: "すべての予約を表示",
        loadError: "今後の予約の読み込みに失敗しました",
        empty: {
          message: "今後の予約はありません"
        }
      },
      maintenance: {
        title: "メンテナンス",
        description: "今後および最近のメンテナンスタスク",
        noTasksScheduled: "スケジュールされたメンテナンスタスクはありません",
        noTasksCompleted: "完了したメンテナンスタスクはありません",
        noTasksInProgress: "進行中のメンテナンスタスクはありません",
        viewAll: "すべてのメンテナンスタスクを表示"
      },
      inspections: {
        title: "点検",
        description: "今後および最近の点検",
        noInspectionsScheduled: "スケジュールされた点検はありません",
        noInspectionsCompleted: "完了した点検はありません",
        noInspectionsInProgress: "進行中の点検はありません",
        viewAll: "すべての点検を表示"
      },
      stats: {
        totalVehicles: "総車両数",
        maintenanceTasks: "メンテナンスタスク",
        inspections: "点検",
        activeVehicles: "稼働中の車両",
        vehiclesInMaintenance: "メンテナンス中",
        scheduledInspections: "スケジュール済み",
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
        },
        tires: {
          title: "タイヤ",
          items: {
            tire_pressure: {
              title: "タイヤ空気圧",
              description: "タイヤ空気圧を推奨レベルに確認・調整します。"
            },
            tread_depth: {
              title: "トレッドの深さ",
              description: "タイヤのトレッドの深さを測定して、十分なグリップを確保します。"
            },
            wear_pattern: {
              title: "摩耗パターン",
              description: "タイヤに不均一な摩耗パターンがないか点検します。"
            }
          }
        }
      },
      tabs: {
        recent: "最近",
        upcoming: "予定",
        inProgress: "進行中"
      }
    },
    fuel: {
      title: "燃料ログ",
      description: "車両の燃料消費と経費を追跡します。",
      new: {
        title: "燃料ログを追加",
        description: "車両の新しい給油を記録します。"
      },
      edit: {
        title: "燃料ログを編集",
        description: "燃料ログの詳細を更新します。"
      },
      fields: {
        date: "日付",
        odometer_reading: "走行距離計の読み",
        fuel_amount: "燃料量（リットル）",
        fuel_cost: "燃料費",
        fuel_type: "燃料タイプ",
        station_name: "ガソリンスタンド名",
        full_tank: "満タン",
        notes: "メモ"
      },
      messages: {
        created: "燃料ログが正常に作成されました",
        updated: "燃料ログが正常に更新されました",
        deleted: "燃料ログが正常に削除されました",
        error: "問題が発生しました"
      },
      noData: "利用可能な燃料ログデータがありません",
      loadingLogs: "燃料ログを読み込み中..."
    },
    mileage: {
      title: "走行距離ログ",
      description: "車両の走行距離と移動を追跡します。",
      new: {
        title: "走行距離ログを追加",
        description: "車両の新しい移動を記録します。"
      },
      edit: {
        title: "走行距離ログを編集",
        description: "走行距離ログの詳細を更新します。"
      },
      fields: {
        date: "日付",
        start_odometer: "開始走行距離計",
        end_odometer: "終了走行距離計",
        distance: "距離",
        purpose: "目的",
        notes: "メモ"
      },
      messages: {
        created: "走行距離ログが正常に作成されました",
        updated: "走行距離ログが正常に更新されました",
        deleted: "走行距離ログが正常に削除されました",
        error: "問題が発生しました"
      },
      loadingLogs: "走行距離ログを読み込み中..."
    },
    reporting: {
      title: "レポートと分析",
      description: "車両フリートの詳細なレポートと分析を表示します。",
      filters: {
        vehicleType: "車両タイプ",
        status: "ステータス",
        apply: "フィルターを適用",
        reset: "リセット"
      },
      export: {
        title: "エクスポート",
        pdf: "PDFとしてエクスポート",
        excel: "Excelとしてエクスポート"
      },
      fromPreviousPeriod: "前の期間から",
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
          costDescription: "すべての車両関連コストの詳細な内訳",
          downloadCSV: "CSVをダウンロード",
          downloadPDF: "PDFをダウンロード",
          generate: {
            title: "カスタムレポートを生成",
            description: "カスタムレポートを設定して生成します。",
            button: "レポートを生成",
            dialog: {
              title: "カスタムレポートを作成",
              description: "カスタムレポートのオプションを選択します。",
              createButton: "レポートを作成して生成"
            }
          },
          customReport: {
            nameLabel: "レポート名",
            namePlaceholder: "レポートの名前を入力",
            reportTypeLabel: "レポートタイプ",
            selectTypePlaceholder: "レポートタイプを選択",
            typeCombined: "総合サマリー",
            typeVehicleSummary: "車両サマリー",
            typeMaintenanceDetail: "メンテナンス詳細",
            typeFuelLog: "燃料使用量",
            typeCostAnalysis: "コスト内訳",
            includeDataLabel: "データセクションを含める",
            includeVehiclesLabel: "車両情報",
            includeMaintenanceLabel: "メンテナンス記録",
            includeFuelLabel: "燃料ログ",
            includeCostsLabel: "コスト分析",
            cancel: "キャンセル"
          },
          recent: {
            title: "最近のレポート",
            description: "最近生成およびダウンロードされたレポート。",
            empty: "最近のレポートは見つかりませんでした。",
            viewAll: "すべてのレポートを表示"
          }
        },
        fleetOverview: {
          title: "フリート概要",
          totalVehicles: "総車両数",
          activeVehicles: "稼働中の車両",
          inMaintenance: "メンテナンス中",
          inactive: "非稼働"
        },
        maintenanceMetrics: {
          title: "メンテナンスメトリクス",
          totalTasks: "総タスク数",
          completedTasks: "完了したタスク",
          averageCompletionTime: "平均完了時間（日）",
          upcomingTasks: "今後のタスク",
          tasksByPriority: "優先度別タスク",
          tasksByStatus: "ステータス別タスク",
          costOverTime: "期間別メンテナンスコスト",
          totalCost: "総メンテナンスコスト",
          scheduledCost: "定期メンテナンス",
          unscheduledCost: "不定期メンテナンス"
        },
        inspectionMetrics: {
          title: "点検メトリクス",
          totalInspections: "総点検数",
          passRate: "合格率",
          failRate: "不合格率",
          commonFailures: "一般的な不合格項目",
          inspectionsByStatus: "ステータス別点検"
        },
        vehicleUtilization: {
          title: "車両稼働率",
          maintenanceCostPerVehicle: "車両あたりメンテナンスコスト",
          inspectionPassRateByVehicle: "車両別点検合格率",
          vehicleStatus: "車両ステータス分布"
        },
        vehiclePerformance: {
          title: "車両パフォーマンス",
          description: "各車両のパフォーマンスメトリクス",
          vehicle: "車両",
          utilization: "稼働率",
          distance: "距離（km）",
          fuelUsed: "使用燃料（L）",
          efficiency: "燃費（km/L）",
          costPerKm: "コスト/km",
          noData: "選択した期間のパフォーマンスデータはありません",
          search: "車両を検索...",
          filterByBrand: "ブランドで絞り込み",
          allBrands: "すべてのブランド",
          noVehiclesFound: "基準に一致する車両は見つかりませんでした",
          scheduled: "定期",
          unscheduled: "不定期",
          consumption: "消費",
          maintenance: "メンテナンス",
          fuel: "燃料"
        },
        costPerKm: {
          title: "キロメートルあたりのコスト",
          description: "車両別のキロメートルあたりのメンテナンスおよび燃料コスト"
        },
        fuelConsumption: {
          title: "燃料消費トレンド",
          description: "車両タイプ別の月間燃料消費量",
          noData: "選択した期間の燃料消費データはありません"
        },
        monthlyMileage: {
          title: "月間走行距離トレンド",
          description: "車両タイプ別の月間走行距離",
          noData: "選択した期間の走行距離データはありません"
        },
        maintenanceFrequency: {
          title: "メンテナンス頻度",
          description: "定期対不定期メンテナンスの頻度"
        },
        vehicleAvailability: {
          title: "車両の可用性",
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
      noData: "選択したフィルターで利用可能なデータはありません"
    },
    schedules: {
      selectDate: "日付を選択",
      tooltips: {
        immediateTaskTitle: "即時タスクを作成",
        immediateTaskDescription: "定期的なスケジュールに加えて、このタスクをすぐに作成します。"
      }
    },
    bookings: {
      title: "予約",
      description: "車両の予約を表示および管理します",
      backToBooking: "予約に戻る",
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
        emailInvoice: "請求書をメール送信"
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
        details: "請求書発行のための請求情報を入力してください",
        companyName: "会社名",
        taxNumber: "税番号 / VAT ID",
        streetName: "通り名",
        streetNumber: "丁・番地 / 建物名",
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
        from: "から",
        to: "まで",
        bookingId: "予約ID",
        at: "at",
        km: "km",
        min: "分"
      },
      status: {
        publish: "公開済み",
        pending: "保留中",
        confirmed: "確定済み",
        completed: "完了",
        cancelled: "キャンセル済み",
        assigned: "割り当て済み"
      },
      filters: {
        statusPlaceholder: "ステータスで絞り込み",
        all: "すべて",
        pending: "保留中",
        confirmed: "確定済み",
        completed: "完了",
        cancelled: "キャンセル済み",
        advancedFilters: "詳細フィルター",
        clearFilters: "フィルターをクリア"
      },
      upcomingBookings: {
        title: "今後の予約",
        description: "レビューと割り当て待ちの予約",
        empty: {
          title: "今後の予約はありません",
          description: "レビューまたは割り当て待ちの予約はありません。"
        }
      },
      empty: {
        title: "予約が見つかりません",
        description: "システムにまだ予約がありません。"
      },
      unnamed: "名前のない顧客",
      viewAll: "すべての予約を表示",
      assignment: {
        title: "ドライバーと車両の割り当て",
        summary: "この予約にドライバーと車両を割り当てます",
        bookingDetails: "予約詳細",
        confirmAssignment: "割り当てを確定",
        driver: "ドライバー",
        vehicle: "車両",
        selectDriver: "ドライバーを選択",
        selectVehicle: "車両を選択",
        driverDetails: "ドライバー詳細",
        vehicleDetails: "車両詳細",
        noDriversAvailable: "この予約時間に対応可能なドライバーがいません",
        noVehiclesAvailable: "利用可能な車両がありません",
        assignSuccess: "割り当てが正常に完了しました",
        assignFailed: "割り当ての完了に失敗しました",
        notAssigned: "未割り当て",
        pickupDate: "迎車日",
        pickupTime: "迎車時間",
        pickupLocation: "迎車場所",
        dropoffLocation: "降車場所",
        edit: "編集",
        saving: "保存中...",
        licensePlate: "ナンバープレート",
        vehicleBrand: "車両ブランド",
        vehicleModel: "車両モデル",
        alternativeVehicles: "代替車両",
        notAvailable: "利用不可",
        name: "名前",
        phone: "電話",
        email: "メール"
      },
      details: {
        title: "予約詳細",
        notFound: "予約が見つかりません",
        notFoundDescription: "お探しの予約が見つかりませんでした。",
        backToBookings: "予約一覧に戻る",
        createdOn: "作成日: {date}",
        lastUpdated: "最終更新日: {date}",
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
          coupon: "クーポン情報",
          pricing: "価格情報"
        },
        fields: {
          bookingId: "予約ID",
          orderTotal: "注文合計",
          pickupDate: "迎車日",
          paymentMethod: "支払い方法",
          pickupTime: "迎車時間",
          paymentStatus: "支払い状況",
          vehicle: "車両",
          capacity: "定員",
          vehicleId: "車両ID",
          vehicleBrand: "車両ブランド",
          vehicleModel: "車両モデル",
          serviceType: "サービスタイプ",
          serviceName: "サービス名",
          pickupLocation: "迎車場所",
          dropoffLocation: "降車場所",
          distance: "距離",
          duration: "所要時間",
          flightNumber: "フライト番号",
          terminal: "ターミナル",
          comment: "コメント",
          email: "メール",
          phone: "電話",
          status: "ステータス",
          paymentLink: "支払いリンク",
          amount: "金額",
          originalPrice: "元値",
          finalAmount: "最終金額",
          name: "名前",
          customerName: "顧客名",
          driver: "ドライバー",
          companyName: "会社名",
          taxNumber: "税番号 / VAT ID",
          street: "通り",
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
          billingCompany: "請求先会社"
        },
        actions: {
          navigateToPickup: "迎車場所へナビゲート",
          navigateToDropoff: "降車場所へナビゲート",
          viewLargerMap: "大きな地図で表示",
          contactCustomer: "顧客に連絡",
          call: "電話",
          sendMessage: "メッセージを送信",
          openPaymentLink: "支払いリンクを開く",
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
          tripChecklist: "運行チェックリスト",
          sendArrivalNotification: "到着通知を送信",
          shareWhatsApp: "WhatsAppで共有",
          shareLine: "LINEで共有",
          shareEmail: "メールで共有",
          exportPdf: "PDFをエクスポート",
          generateInvoice: "請求書を生成",
          emailInvoice: "請求書をメール送信",
          emailCustomer: "顧客にメール",
          callCustomer: "顧客に電話",
          textCustomer: "顧客にテキストメッセージ"
        },
        driverActions: {
          title: "ドライバーアクション",
          tripManagement: "運行管理",
          shareBooking: "予約を共有",
          addToGoogleCalendar: "Googleカレンダーに追加"
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
        weather: {
          title: "出発日の天気予報",
          notAvailable: "{date}の予報はありません",
          errorMessage: "天気予報の取得に失敗しました",
          disclaimer: "* 天気データ提供: WeatherAPI.com",
          forecastUnavailable: "{date}の予報はありません"
        },
        placeholders: {
          noRouteInfo: "ルート情報がありません",
          noPaymentLink: "支払いリンクがありません",
          notProvided: "提供されていません",
          noComments: "コメントはありません"
        },
        customerSince: "顧客登録日: {date}",
        status: {
          confirmed: "確定済み",
          pending: "保留中",
          cancelled: "キャンセル済み",
          completed: "完了"
        },
        quickCustomerActions: "クイック顧客アクション",
        tooltips: {
          emailTo: "にメールを送信",
          callTo: "に電話をかける",
          textTo: "にテキストメッセージを送信"
        },
        flightInformation: "フライト情報",
        notesAndInstructions: "メモと指示",
        googleMapsApiKeyMissing: "Google Maps APIキーがありません",
        googleMapsApiKeyMissingDescription: "Google Maps APIキーが設定されていません。環境変数にNEXT_PUBLIC_Maps_API_KEYを追加してください。手動での住所入力は引き続き機能します。"
      },
      edit: {
        title: "予約 #{id} を編集",
        description: "この予約の情報を更新します",
        backToDetails: "詳細に戻る",
        saveChanges: "変更を保存",
        saving: "保存中...",
        success: "成功",
        error: "エラー",
        successMessage: "予約は正常に更新されました",
        errorMessage: "予約の更新中にエラーが発生しました"
      },
      messages: {
        createSuccess: "予約が正常に作成されました",
        updateSuccess: "予約が正常に更新されました",
        deleteSuccess: "予約が正常に削除されました",
        syncSuccess: "予約が正常に同期されました",
        error: "エラーが発生しました",
        confirmSuccess: "予約が正常に確定されました",
        confirmError: "予約の確定中にエラーが発生しました",
        createError: "予約の作成中にエラーが発生しました"
      },
      sync: {
        title: "予約を同期",
        description: "外部システムから予約を同期します",
        connectionIssue: "外部予約システムとの接続に問題がある可能性があります。",
        success: "予約が正常に同期されました",
        failed: "同期に失敗しました",
        syncing: "同期中...",
        syncButton: "予約を同期",
        retrying: "再試行中...",
        retryButton: "接続を再試行",
        successWithCount: "{count}件の予約を正常に同期しました（{created}件作成、{updated}件更新）",
        confirmUpdates: "予約の更新を確認",
        confirmUpdatesDescription: "以下の予約に変更があります。更新したい予約を選択してください。",
        syncSummary: "作成する新しい予約が{newCount}件、更新する予約が{updateCount}件見つかりました。",
        newBookingsAutomatically: "新しい予約は自動的に作成されます。",
        confirmAndSync: "確認して同期",
        cancelled: "ユーザーによって同期がキャンセルされました",
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
      calculateRoute: "ルートの距離と所要時間を計算",
      autoCalculateAvailable: "自動計算が利用可能",
      bookingManagement: "予約管理",
      createBooking: "予約を作成",
      confirmBooking: "予約を確定",
      messageCustomer: "顧客にメッセージ",
      youCanNowCreateBooking: "このサービスの予約を作成できるようになりました",
      invoiceMustBePaidBeforeCreatingBooking: "予約を作成する前に請求書を支払う必要があります",
      createdOn: "{date}に作成",
      confirmedOn: "{date}に確定",
      serviceDate: "サービス日",
      pickupTime: "迎車時間",
      vehicle: "車両",
      duration: "所要時間"
    },
    dispatch: {
      title: "リアルタイム配車センター",
      description: "割り当てを管理し、車両をリアルタイムで追跡します",
      assignments: {
        title: "割り当てセンター",
        description: "予約に対するドライバーと車両の割り当てを管理します",
        resourceAvailability: "リソースの空き状況",
        availableDrivers: "対応可能なドライバー",
        availableVehicles: "利用可能な車両",
        pendingBookings: "保留中",
        assignedBookings: "割り当て済み",
        searchPlaceholder: "顧客、予約IDで予約を検索...",
        allDates: "すべての日付",
        today: "今日",
        thisWeek: "今週",
        thisMonth: "今月",
        allBookings: "すべての予約",
        unassigned: "未割り当て",
        assigned: "割り当て済み",
        confirmed: "確定済み",
        unknownCustomer: "不明な顧客",
        vehicleService: "車両サービス",
        driver: "ドライバー",
        vehicle: "車両",
        smartAssign: "スマート割り当て",
        viewDetails: "詳細を表示",
        unassignAll: "すべて割り当て解除",
        smartAssignmentFor: "#{id}のスマート割り当て",
        smartAssignmentDescription: "サービス要件と車両能力に基づいたインテリジェントなマッチング",
        availableDriversCount: "対応可能なドライバー ({count})",
        noDriversAvailable: "対応可能なドライバーがいません",
        statusAvailable: "対応可能",
        vehicleRecommendations: "車両推奨 ({count})",
        noVehiclesAvailable: "利用可能な車両がありません",
        matchPercentage: "{percentage}% 一致",
        assign: "割り当て",
        bookingDetails: "予約詳細",
        customerInformation: "顧客情報",
        serviceDetails: "サービス詳細",
        from: "から：",
        to: "まで：",
        assignmentStatus: "割り当て状況",
        notAssigned: "未割り当て",
        actions: "アクション",
        viewFullDetails: "全詳細を表示",
        editBooking: "予約を編集",
        callCustomer: "顧客に電話",
        loading: "割り当てを読み込み中...",
        noBookingsFound: "予約が見つかりません",
        noBookingsFilter: "検索条件を調整してみてください",
        noBookingsAvailable: "割り当て可能な予約がありません",
        messages: {
          unassignSuccess: "予約の割り当てが正常に解除されました",
          unassignError: "予約の割り当て解除に失敗しました",
          assignSuccess: "ドライバーと車両が正常に割り当てられました",
          assignError: "ドライバーと車両の割り当てに失敗しました",
          loadError: "割り当てデータの読み込みに失敗しました"
        }
      },
      availability: {
        title: "空き状況概要",
        availableDrivers: "対応可能なドライバー",
        availableVehicles: "利用可能な車両",
        totalDrivers: "総ドライバー数",
        totalVehicles: "総車両数",
        driverUtilization: "ドライバー稼働率",
        vehicleUtilization: "車両稼働率",
        nextAvailable: "次に利用可能",
        currentlyAssigned: "現在割り当て済み",
        onBreak: "休憩中",
        maintenance: "メンテナンス中",
        unavailable: "対応不可"
      },
      assignment: {
        title: "割り当て管理",
        quick: "クイック割り当て",
        bulk: "一括割り当て",
        auto: "自動割り当て",
        manual: "手動割り当て",
        assignDriver: "ドライバーを割り当て",
        assignVehicle: "車両を割り当て",
        assignBooking: "予約を割り当て",
        unassign: "割り当て解除",
        reassign: "再割り当て",
        assignmentHistory: "割り当て履歴",
        currentAssignments: "現在の割り当て",
        availableDrivers: "対応可能なドライバー",
        availableVehicles: "利用可能な車両",
        pendingBookings: "保留中の予約",
        assignmentConflict: "割り当ての競合",
        resolveConflict: "競合を解決",
        autoAssignmentRules: "自動割り当てルール",
        oneClickAssign: "ワンクリック割り当て",
        smartAssignModal: "スマート割り当て",
        selectResources: "リソースを選択",
        assignmentPreferences: "割り当て設定",
        notificationSettings: "通知設定"
      },
      smartModal: {
        title: "予約#{id}のスマート割り当て",
        description: "この予約に最適なドライバーと車両を選択します",
        driverSection: "対応可能なドライバー",
        vehicleSection: "利用可能な車両",
        preferredDrivers: "優先ドライバー",
        alternativeDrivers: "代替ドライバー",
        recommendedVehicles: "推奨車両",
        alternativeVehicles: "代替車両",
        noDriversAvailable: "この時間帯に対応可能なドライバーがいません",
        noVehiclesAvailable: "利用可能な車両がありません",
        driverScore: "一致スコア",
        nextAvailableTime: "次に利用可能: {time}",
        currentLocation: "現在地",
        estimatedTravelTime: "推定移動時間: {time}",
        compatibility: "互換性",
        experience: "経験",
        rating: "評価",
        preferences: "設定"
      },
      notificationOptions: {
        title: "通知オプション",
        description: "割り当てられたリソースへの通知方法を選択します",
        emailNotification: "メール通知",
        emailDescription: "ドライバーと顧客にメールを送信",
        pushNotification: "プッシュ通知",
        pushDescription: "ドライバーのモバイルアプリにプッシュ通知を送信",
        smsNotification: "SMS通知",
        smsDescription: "ドライバーの電話にSMSを送信",
        includeCustomer: "顧客を含める",
        customerDescription: "顧客に確認を送信",
        customMessage: "カスタムメッセージ",
        customMessagePlaceholder: "カスタムメッセージを追加（オプション）"
      },
      filters: {
        status: "ステータス",
        date: "日付",
        driver: "ドライバー",
        vehicle: "車両",
        all: "すべてのエントリ",
        location: "場所",
        zone: "ゾーン",
        priority: "優先度",
        serviceType: "サービスタイプ",
        dateRange: "期間",
        assignmentStatus: "割り当て状況",
        bookingStatus: "予約状況",
        customerName: "顧客名",
        bookingId: "予約ID",
        filterByStatus: "ステータスで絞り込み",
        filterByDate: "日付で絞り込み",
        filterByDriver: "ドライバーで絞り込み",
        filterByVehicle: "車両で絞り込み",
        clearAllFilters: "すべてのフィルターをクリア",
        applyFilters: "フィルターを適用"
      },
      search: {
        placeholder: "顧客名または予約IDで予約を検索...",
        advanced: "詳細検索",
        quickSearch: "クイック検索",
        searchResults: "検索結果",
        noResults: "検索条件に一致する予約がありません",
        searchByCustomer: "顧客名で検索",
        searchByBookingId: "予約IDで検索",
        searchByLocation: "場所で検索"
      },
      mapView: {
        title: "マップ表示",
        showList: "リストを表示",
        hideList: "リストを非表示",
        todaysBookings: "本日の予約",
        manage: "割り当て",
        manageAssignments: "割り当てを管理",
        satellite: "衛星写真",
        roadmap: "地図",
        hybrid: "ハイブリッド",
        terrain: "地形",
        traffic: "交通状況",
        vehicles: "車両",
        routes: "ルート",
        autoCenter: "自動中央揃え",
        hideTraffic: "交通状況を非表示",
        centerMap: "地図を中央に",
        fullscreen: "フルスクリーン",
        exitFullscreen: "フルスクリーンを終了",
        zoomIn: "ズームイン",
        zoomOut: "ズームアウト",
        togglePanel: "パネルを切り替え",
        expandPanel: "パネルを展開",
        collapsePanel: "パネルを折りたたむ",
        showRoute: "ルートを表示",
        hideRoute: "ルートを非表示",
        liveTracking: "ライブ追跡",
        offline: "オフライン"
      },
      board: {
        view: "ボード表示",
        title: "配車ボード",
        pending: "保留中",
        confirmed: "確定済み",
        assigned: "割り当て済み",
        enRoute: "移動中",
        arrived: "到着済み",
        inProgress: "進行中",
        completed: "完了",
        cancelled: "キャンセル済み",
        addEntry: "割り当てを追加"
      },
      realTimeTracking: {
        title: "ライブ車両追跡",
        description: "全車両のリアルタイム位置とステータス",
        lastUpdate: "最終更新",
        batteryLevel: "バッテリー",
        speed: "速度",
        heading: "方角",
        accuracy: "精度",
        moving: "移動中",
        stationary: "停止中",
        offline: "オフライン",
        online: "オンライン",
        noLocation: "位置データなし",
        deviceOffline: "デバイスオフライン",
        trackingEnabled: "リアルタイム追跡有効",
        trackingDisabled: "リアルタイム追跡無効"
      },
      actions: {
        assignDriver: "ドライバーを割り当て",
        assignVehicle: "車両を割り当て",
        assignBooking: "予約を割り当て",
        updateStatus: "ステータスを更新",
        addNote: "メモを追加",
        viewDetails: "詳細を表示",
        createEntry: "エントリを作成",
        editEntry: "エントリを編集",
        deleteEntry: "エントリを削除",
        assignDriverTo: "予約#{id}にドライバーを割り当て",
        assignVehicleTo: "予約#{id}に車両を割り当て",
        startTrip: "運行を開始",
        endTrip: "運行を終了",
        markArrived: "到着済みとしてマーク",
        sendNotification: "通知を送信",
        viewOnMap: "地図で表示",
        trackVehicle: "車両を追跡",
        contactDriver: "ドライバーに連絡",
        emergencyAlert: "緊急アラート"
      },
      status: {
        pending: "保留中",
        assigned: "割り当て済み",
        confirmed: "確定済み",
        en_route: "移動中",
        arrived: "到着済み",
        in_progress: "進行中",
        completed: "完了",
        cancelled: "キャンセル済み",
        emergency: "緊急"
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
        updatedAt: "更新日時",
        assignedBy: "割り当て者",
        estimatedArrival: "到着予定時刻",
        actualArrival: "実際の到着時刻",
        pickupLocation: "迎車場所",
        dropoffLocation: "降車場所",
        distance: "距離",
        priority: "優先度",
        deviceId: "デバイスID",
        lastSeen: "最終確認",
        batteryLevel: "バッテリー残量"
      },
      placeholders: {
        selectDriver: "ドライバーを選択",
        selectVehicle: "車両を選択",
        selectBooking: "予約を選択",
        selectStatus: "ステータスを選択",
        enterNotes: "この配車に関するメモを入力",
        startTime: "開始時間を選択",
        endTime: "終了時間を選択"
      },
      messages: {
        createSuccess: "配車割り当てが正常に作成されました",
        updateSuccess: "配車割り当てが正常に更新されました",
        deleteSuccess: "配車割り当てが正常に削除されました",
        createError: "配車割り当ての作成中にエラーが発生しました",
        updateError: "配車割り当ての更新中にエラーが発生しました",
        deleteError: "配車割り当ての削除中にエラーが発生しました",
        driverAssigned: "ドライバーが正常に割り当てられました",
        vehicleAssigned: "車両が正常に割り当てられました",
        vehicleUnassigned: "車両の割り当てが正常に解除されました",
        bookingAssigned: "予約が正常に割り当てられました",
        statusUpdated: "ステータスが正常に更新されました",
        notesAdded: "メモが正常に追加されました",
        tripStarted: "運行が正常に開始されました",
        tripEnded: "運行が正常に完了しました",
        arrivedAtDestination: "目的地に到着済みとしてマークされました",
        locationUpdated: "位置が更新されました",
        trackingError: "追跡データの更新中にエラーが発生しました",
        assignmentConflict: "割り当ての競合が検出されました",
        noAvailableDrivers: "利用可能なドライバーがいません",
        noAvailableVehicles: "利用可能な車両がありません",
        deviceConnected: "追跡デバイスが接続されました",
        deviceDisconnected: "追跡デバイスが切断されました"
      },
      empty: {
        title: "配車割り当てが見つかりません",
        description: "選択したフィルターの配車割り当てはありません。",
        searchResults: "検索条件に一致する配車割り当てがありません。",
        noVehiclesOnline: "現在オンラインの車両はありません",
        noActiveAssignments: "アクティブな割り当てはありません"
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
      details: {
        title: "割り当て詳細",
        bookingDetails: "予約詳細",
        driverDetails: "ドライバー詳細",
        vehicleDetails: "車両詳細",
        trackingDetails: "追跡詳細",
        statusHistory: "ステータス履歴",
        notes: "割り当てメモ",
        timeline: "運行タイムライン",
        route: "ルート情報",
        performance: "パフォーマンスメトリクス"
      },
      timelineView: {
        title: "配車タイムライン",
        scale: "スケール",
        hour: "時間",
        day: "日",
        week: "週",
        zoomIn: "ズームイン",
        zoomOut: "ズームアウト"
      },
      notifications: {
        newAssignment: "新しい割り当てが作成されました",
        statusChanged: "割り当てステータスが変更されました",
        vehicleArrived: "車両が目的地に到着しました",
        tripStarted: "運行が開始されました",
        tripCompleted: "運行が完了しました",
        emergencyAlert: "緊急アラート",
        deviceOffline: "追跡デバイスがオフラインです",
        deviceOnline: "追跡デバイスがオンラインです",
        assignmentOverdue: "割り当てが期限切れです"
      },
      tracking: {
        devices: "追跡デバイス",
        setupDevice: "デバイスを設定",
        deviceStatus: "デバイスステータス",
        lastLocation: "最終位置",
        route: "ルート",
        geofence: "ジオフェンス",
        alerts: "追跡アラート",
        history: "位置履歴",
        playback: "ルート再生"
      }
    },
    settings: {
      title: "設定",
      description: "アカウント設定と個人設定を管理します",
      selectTab: "設定タブを選択",
      profile: {
        title: "プロフィール",
        description: "プロフィール情報を管理します",
        name: "名前",
        email: "メールアドレス",
        emailDescription: "あなたのメールアドレスはログインと通知に使用されます。"
      },
      preferences: {
        title: "個人設定",
        description: "アプリケーションの体験をカスタマイズします",
        theme: {
          title: "テーマ",
          light: "ライト",
          dark: "ダーク",
          system: "システム"
        },
        language: {
          title: "言語",
          en: "English",
          ja: "日本語"
        }
      },
      menu: {
        title: "メニュー設定",
        description: "ナビゲーションに表示されるメニュー項目をカスタマイズします",
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
        quotations: "見積",
        dispatch: "配車ボード",
        pricing: "価格設定",
        assignments: "割り当て",
        save: "変更を保存"
      },
      templates: {
        title: "点検テンプレート",
        description: "点検フォームの構造（セクションと項目）を管理します。",
        manageTitle: "{type}テンプレートを管理",
        managerDescription: "{type}点検テンプレートを設定およびカスタマイズします。セクションと項目を追加して、点検プロセスを効率化します。",
        createSuccess: "テンプレートタイプが正常に作成されました",
        createError: "テンプレートタイプの作成に失敗しました",
        nameRequired: "テンプレート名は必須です",
        slugRequired: "テンプレートスラッグは必須です",
        invalidSlug: "無効なスラッグ形式です。小文字の英字、数字、ハイフンのみを使用してください",
        slugExists: "このスラッグはすでに存在します。別のものを使用してください",
        add: "テンプレートタイプを追加",
        addTemplate: "新しいテンプレートタイプを追加",
        addTemplateDescription: "新しい点検テンプレートタイプを作成します",
        templateName: "テンプレート名",
        templateNamePlaceholder: "テンプレート名を英語で入力",
        templateNamePlaceholderJa: "テンプレート名を日本語で入力",
        templateSlug: "テンプレートスラッグ",
        templateSlugPlaceholder: "URLフレンドリーな識別子を入力",
        templateSlugDescription: "小文字の英字、数字、ハイフンのみ",
        duplicate: "テンプレートを複製",
        duplicateTemplate: "テンプレートを複製",
        duplicateSuccess: "テンプレートが正常に複製されました",
        duplicateError: "テンプレートの複製に失敗しました",
        deleteTemplate: "テンプレートを削除",
        deleteTemplateConfirm: "このテンプレートを削除してもよろしいですか？この操作は元に戻せません。",
        deleteSuccess: "テンプレートが正常に削除されました",
        deleteError: "テンプレートの削除に失敗しました"
      },
      tabs: {
        profile: "プロフィール",
        preferences: "個人設定",
        menu: "メニュー",
        templates: "テンプレート",
        account: "アカウント",
        notifications: "通知",
        security: "セキュリティ",
        localization: "言語と地域",
        data: "データ管理"
      },
      selectTemplate: "テンプレートタイプを選択",
      inspectionTypes: {
        routine: "定期点検",
        safety: "安全点検",
        maintenance: "整備点検",
        daily: "日常点検",
        test: "テスト点検",
        select: "点検タイプを選択",
        description: {
          routine: "車両コンポーネントの定期的な点検",
          safety: "包括的な安全システム評価",
          maintenance: "詳細な機械システム点検",
          daily: "日常点検チェックリスト",
          test: "テスト点検テンプレート"
        }
      }
    },
    notifications: {
      sendSuccess: "項目が正常に送信されました",
      error: "エラーが発生しました",
      createSuccess: "項目が正常に作成されました",
      updateSuccess: "項目が正常に更新されました",
      deleteSuccess: "項目が正常に削除されました"
    },
    system: {
      notifications: {
        error: "エラーが発生しました",
        success: "操作が正常に完了しました",
        warning: "警告",
        info: "情報"
      }
    }
  }

export default ja
