import { TranslationValue } from "../types";

export const ja: TranslationValue = {
  common: {
    status: {
      inProgress: "進行中",
      upcoming: "近日公開",
      recent: "最近",
      active: "アクティブ",
      inactive: "非アクティブ",
      completed: "完了",
      scheduled: "予定されている",
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
    noResults: "結果が見つかりません",
    details: "詳細",
    actions: {
      default: "アクション",
      goHome: "ホームに戻る",
      tryAgain: "再試行"
    },
    viewDetails: "詳細を表示",
    addNew: "新規追加",
    backTo: "に戻る",
    backToList: "リストに戻る",
    saving: "保存中...",
    update: "更新",
    create: "作成",
    created: "作成済み",
    deleting: "削除中...",
    creating: "作成中...",
    menu: "メニュー",
    login: "ログイン",
    logout: "ログアウト",
    darkMode: "ダークモード",
    inProgress: "進行中",
    upcoming: "近日公開",
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
    text: "SMS",
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
    notAvailable: "該当なし",
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
    quotations: "見積もり",
    pricing: "価格設定",
    dispatch: "配車",
    maintenance: "メンテナンス",
    inspections: "点検",
    reporting: "レポート",
    settings: "設定",
    fleet: "フリート",
    sales: "セールス",
    operations: "オペレーション",
    logout: "ログアウト"
  },
  inspections: {
    title: "点検",
    description: "車両点検を管理および追跡します。",
    searchPlaceholder: "車両またはタイプで点検を検索...",
    createInspection: "点検を作成",
    createNewInspection: "新しい点検を作成",
    createNewInspectionDescription: "新しい点検記録を作成するために詳細を入力してください。",
    viewDetails: "詳細を表示",
    performInspection: "点検を実行",
    noInspections: "点検が見つかりません。",
    addNew: "最初の点検を追加してください。",
    unnamedInspection: "無名の点検",
    noVehicle: "車両が割り当てられていません",
    noVehicleAssigned: "車両が割り当てられていません",
    overallNotes: "総合メモ",
    selectDate: "日付範囲を選択",
    groupBy: "グループ化",
    defaultType: "日常点検",
    typeLabel: "タイプ",
    statusLabel: "ステータス", 
    inspectorLabel: "点検者",
    inspectorEmailLabel: "点検者メールアドレス",
    groupByOptions: {
      date: "日付",
      vehicle: "車両",
      none: "なし"
    },
    quickStats: {
      title: "点検概要",
      todaysInspections: "今日の点検",
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
      previousMonth: "前月",
      nextMonth: "来月",
      previousWeek: "前週",
      nextWeek: "来週",
      previousDay: "前日",
      nextDay: "翌日",
      noInspectionsOnDate: "この日に予定されている点検はありません",
      inspectionsOnDate: "{date}に{count}件の点検",
      scheduleInspection: "点検をスケジュール",
      viewInspection: "点検を表示"
    },
    status: {
      pending: "保留中",
      inProgress: "進行中",
      completed: "完了",
      failed: "不合格",
      scheduled: "予定"
    },
    type: {
      routine: "日常点検",
      safety: "安全点検",
      maintenance: "整備点検",
      daily: "日常点検",
      unspecified: "未指定",
      description: {
        routine: "車両システムの包括的な点検。",
        safety: "安全上重要なコンポーネントの重点的な点検。",
        maintenance: "詳細な機械システムの点検。",
        daily: "必須コンポーネントの簡単な日常点検。"
      }
    },
    typeValues: {
      routine: "日常点検",
      safety: "安全点検",
      maintenance: "整備点検",
      daily: "日常点検",
      unspecified: "未指定"
    },
    statusValues: {
      pass: "合格",
      fail: "不合格",
      pending: "保留中",
      inProgress: "進行中",
      completed: "完了",
      failed: "不合格",
      scheduled: "予定"
    },
    fields: {
      vehicle: "車両",
      selectVehiclePlaceholder: "車両を選択",
      date: "日付",
      type: "タイプ",
      status: "ステータス",
      inspector: "点検者",
      inspectorEmail: "点検者メールアドレス",
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
      upcoming: "近日公開",
      older: "過去"
    },
    stats: {
      count: "{{count}} 件の点検",
      vehicleCount: "{{count}} 件の点検"
    },
    steps: {
      selectVehicle: "車両を選択",
      selectType: "点検タイプを選択"
    },
    labels: {
      progress: "点検進捗",
      estimatedTime: "推定残り時間",
      model: "モデル",
      photoNumber: "写真 {{number}}",
      currentSection: "現在のセクション",
      showingVehicles: "{{total}}台中 {{start}}-{{end}}台を表示中"
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
      photos: "{{count}} 枚の写真",
      needsRepair: "修理が必要な項目",
      scheduleRepair: "修理をスケジュール",
      scheduleRepairDescription: "不合格項目のメンテナンスタスクを作成",
      start: "点検を開始",
      continueEditing: "編集を続行",
      markAsCompleted: "完了としてマーク",
      printReport: "レポートを印刷",
      exportHtml: "HTMLをエクスポート",
      exportPdf: "PDFをエクスポート"
    },
    messages: {
      saveSuccess: "点検が正常に保存されました",
      saveError: "点検の保存エラー",
      exportSuccess: "点検が正常にエクスポートされました",
      exportError: "点検のエクスポートエラー",
      completeSuccess: "点検が完了としてマークされました",
      completeError: "点検の完了エラー",
      printStarted: "印刷を開始しました",
      errorLoadingTemplate: "点検テンプレートの読み込みエラー",
      defaultRepairDescription: "点検で不合格になった項目の修理タスク。",
      unknownItem: "不明な項目",
      repairNeededFor: "修理が必要",
      andMoreItems: "および他{count}項目",
      pdfDownloaded: "PDFが正常にダウンロードされました",
      csvDownloaded: "CSVが正常にダウンロードされました"
    },
    details: {
      title: "点検詳細",
      printTitle: "点検レポート",
      scheduledFor: "{date}に予定",
      inspectionItems: "点検項目",
      vehicleInfoTitle: "車両情報",
      overviewTitle: "点検概要",
      summaryTitle: "点検サマリー",
      summaryPassed: "合格項目",
      summaryFailed: "不合格項目",
      summaryNotes: "メモ付き項目",
      summaryPhotos: "撮影写真",
      passRate: "合格率",
      attentionRequired: "要注意",
      itemsNeedAttention: "{count}項目が注意を必要としています",
      allItemsTitle: "全点検項目 ({count})",
      failedItemsTitle: "不合格項目 ({count})",
      passedItemsTitle: "合格項目 ({count})",
      repairNeededTitle: "修理が必要な項目",
      repairNeededDescription: "以下の項目は点検で不合格となり、注意が必要です。下のボタンをクリックしてメンテナンスタスクをスケジュールしてください。",
      repairTaskTitle: "{inspectionName}の点検後修理 ({vehicleName})",
      photosTitle: "写真 ({count})",
      photosTabDescription: "この点検中に撮影されたすべての写真を表示します。",
      noPhotosMessage: "この点検では写真が撮影されませんでした。",
      viewPhotoAria: "{itemName}の写真を表示",
      photoItemAlt: "{itemName}の写真",
      inspectionInfo: {
        title: "点検情報"
      },
      summary: {
        title: "サマリー",
        passedItems: "合格項目",
        failedItems: "不合格項目",
        itemsWithNotes: "メモ付き項目",
        photosTaken: "撮影写真"
      },
      items: {
        title: "点検項目",
        itemHeader: "項目",
        statusHeader: "ステータス",
        notesHeader: "メモ"
      },
      pdfFooter: {
        generatedOn: "{date}に生成",
        vehicleName: "車両: {name}"
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
        title: "点検者",
        name: "点検者名",
        email: "点検者メールアドレス"
      },
      results: {
        title: "点検サマリー",
        passedLabel: "合格項目",
        failedLabel: "不合格項目",
        notesLabel: "メモ付き項目",
        photosLabel: "撮影写真",
        passCount: "合格項目: {count}",
        failCount: "不合格項目: {count}",
        notesCount: "メモ追加: {count}",
        photoCount: "撮影写真: {count}",
        completionRate: "完了率",
        lastUpdated: "最終更新",
        failedItemsFound: "不合格項目が見つかりました",
        failedItemsDescription: "以下の項目は点検基準を満たしませんでした。",
        allPassed: "すべての項目が合格",
        noFailedItems: "この点検で不合格項目は見つかりませんでした。"
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
        counter: "{current} / {total}"
      },
      notes: {
        title: "総合点検メモ"
      },
      dateLabel: "点検日",
      isScheduled: "スケジュール済み",
      isScheduledDescription: "点検が定期スケジュールの一部であるかどうかを示します。",
      overallNotes: "総合メモ",
      overallNotesPlaceholder: "点検に関する総合的なメモを入力してください..."
    },
    dateLabel: "点検日"
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
      brand: "ステータスでフィルター",
      model: "タイプでフィルター",
      allBrands: "すべてのステータス",
      allModels: "すべてのタイプ",
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
      manageVehiclesFor: "{name}の車両を管理"
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
      active: "アクティブ",
      inactive: "非アクティブ",
      on_leave: "休暇中",
      training: "研修中",
      available: "対応可能",
      unavailable: "対応不可",
      leave: "休暇中"
    },
    availability: {
      title: "ドライバー対応状況",
      description: "このドライバーの対応可能期間を管理します。対応可能、休暇中、研修中の設定ができます。",
      setStatus: "ステータスを設定",
      statusLabel: "対応状況ステータス",
      selectStatus: "ステータスを選択",
      addAvailability: "対応可能期間を追加",
      editAvailability: "対応可能期間を編集",
      deleteAvailability: "対応可能期間を削除",
      calendarView: "カレンダー表示",
      listView: {
        title: "リスト表示",
        noRecords: "対応状況記録が見つかりません。上のボタンをクリックして追加してください。",
        loading: "読み込み中...",
        addAvailability: "対応状況を追加",
        editAvailability: "対応状況を編集",
        deleteConfirmTitle: "よろしいですか？",
        deleteConfirmMessage: "この操作は元に戻せません。この対応状況記録が完全に削除されます。",
        deleteSuccess: "対応状況が削除されました",
        deleteSuccessMessage: "ドライバーの対応状況が正常に削除されました",
        deleteError: "ドライバーの対応状況の削除に失敗しました",
        loadError: "ドライバーの対応状況の読み込みに失敗しました",
        editDisabledTooltip: "予約割り当ては編集できません",
        deleteDisabledTooltip: "予約割り当ては削除できません"
      },
      loading: "読み込み中...",
      setAvailability: "対応状況を設定",
      setAvailabilityFor: "{date}の対応状況を設定",
      noAvailabilityRecords: "対応状況記録がありません",
      availabilityRecords: "対応状況記録",
      calendar: "対応状況カレンダー",
      dateRange: "日付範囲",
      startDate: "開始日",
      endDate: "終了日",
      status: "ステータス",
      currentStatus: "現在のステータス",
      notes: "メモ",
      actions: "アクション",
      notesPlaceholder: "この対応可能期間に関するコメントを追加",
      statusActive: "アクティブ",
      statusInactive: "非アクティブ",
      statusMessage: "このドライバーは現在{date}まで{status}で、予約に割り当てることができません。",
      availableMessage: "このドライバーは現在予約割り当てが可能です。",
      upcomingSchedule: "今後のスケジュール",
      noUpcomingSchedule: "今後のスケジュール変更はありません。",
      returnsFromLeave: "休暇から復帰",
      viewFullSchedule: "完全なスケジュールを表示",
      statuses: {
        available: "対応可能",
        unavailable: "対応不可",
        leave: "休暇中",
        training: "研修中"
      },
      messages: {
        createSuccess: "対応可能期間が正常に作成されました",
        updateSuccess: "対応可能期間が正常に更新されました",
        deleteSuccess: "対応可能期間が正常に削除されました",
        createError: "対応可能期間の作成に失敗しました",
        updateError: "対応可能期間の更新に失敗しました",
        deleteError: "対応可能期間の削除に失敗しました"
      },
      returnMessage: "このドライバーは{date}に仕事に復帰します。",
      onBookingMessage: "このドライバーは現在{endTime}まで予約中です。"
    },
    vehicles: {
      title: "割り当て車両",
      description: "このドライバーに割り当てられた車両"
    },
    pagination: {
      showing: "{total}項目中{start}-{end}項目を表示中"
    },
    errors: {
      loadFailed: {
        title: "ドライバーを読み込めませんでした",
        description: "ドライバーID {driverId}の詳細を取得できませんでした。再試行するか、問題が解決しない場合はサポートにお問い合わせください。"
      },
      consoleDriverIdError: "サーバーコンポーネントでドライバーIDが見つからないか無効です。",
      consoleLoadError: "サーバーコンポーネントでドライバーID {driverId}のデータ読み込みエラー:"
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
      brand: "ブランドでフィルター",
      model: "モデルでフィルター",
      allBrands: "すべてのブランド",
      allModels: "すべてのモデル",
      noResults: "検索条件に一致する車両が見つかりませんでした",
      clearFilters: "フィルターをクリア"
    },
    pagination: {
      showing: "{total}台中{start}-{end}台の車両を表示中",
      loadMore: "さらに読み込む",
      page: "ページ{page}",
      of: "全{total}ページ中"
    },
    fields: {
      name: "車両名",
      nameDescription: "この車両を識別するためのわかりやすい名前",
      namePlaceholder: "例：家族用SUV",
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
      vin: "VIN",
      vinLabel: "VIN",
      vinDescription: "17桁の車両識別番号",
      status: "ステータス",
      statusLabel: "ステータス",
      statusDescription: "車両の現在の運用ステータス",
      addedOnLabel: "追加日",
      passengerCapacityLabel: "乗車定員",
      luggageCapacityLabel: "荷物容量",
      nameLabel: "名前",
      image: "車両画像",
      imageDescription: "PNG、JPG、またはWEBP（最大800x400px）",
      modelDescription: "車両のモデル名",
      yearDescription: "製造年",
      plateNumberDescription: "車両登録番号",
      plateNumberPlaceholder: "例：ABC-1234",
      statusPlaceholder: "車両ステータスを選択",
      statusActive: "アクティブ",
      statusInactive: "非アクティブ",
      statusMaintenance: "メンテナンス中",
      uploadImage: "画像をアップロード",
      formCompletion: "フォーム入力状況",
      formCompletionDescription: "必須項目の進捗状況",
      vinPlaceholder: "17桁のVINを入力",
      uploadImageButton: "画像をアップロード",
      uploadImageDragText: "ここに画像をドラッグ＆ドロップするか、クリックして選択してください",
      uploadImageSizeLimit: "最大ファイルサイズ：5MB",
      type: "車両タイプ",
      luggageCapacity: "荷物容量",
      luggageCapacityDescription: "最大荷物個数",
      luggageCapacityPlaceholder: "例：4",
      passengerCapacity: "乗車定員",
      passengerCapacityDescription: "最大乗車人数",
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
      uploadImageDragText: "ここに画像をドラッグ＆ドロップするか、クリックして選択してください",
      uploadImageSizeLimit: "最大ファイルサイズ：5MB"
    },
    tabs: {
      info: "情報",
      history: "履歴",
      bookings: "予約",
      inspections: "点検",
      historyEmpty: "履歴はありません",
      bookingsEmpty: "予約が見つかりません",
      inspectionsEmpty: "点検が見つかりません",
      allHistory: "すべての履歴",
      maintenanceHistory: "メンテナンス履歴",
      inspectionHistory: "点検履歴",
      bookingHistory: "予約履歴",
      filterBy: "フィルター",
      allTypes: "すべてのタイプ",
      maintenance: "メンテナンス",
      inspection: "点検",
      booking: "予約",
      vehicleBookings: "車両予約",
      vehicleInspections: "車両点検",
      noBookingsForVehicle: "この車両の予約が見つかりません",
      noInspectionsForVehicle: "この車両の点検が見つかりません",
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
    addNewDescription: "フリートに新しい車両を追加",
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
      editVehicle: "車両を編集"
    },
    edit: {
      title: "車両を編集",
      description: "車両情報を更新"
    },
    delete: {
      title: "車両を削除",
      description: "この操作は元に戻せません。車両が完全に削除され、サーバーから削除されます。"
    },
    schedule: {
      title: "今後のタスク",
      maintenanceTitle: "予定されたメンテナンス",
      inspectionsTitle: "予定された点検",
      noUpcoming: "今後のタスクは予定されていません",
      noMaintenanceTasks: "メンテナンスタスクは予定されていません",
      noInspections: "点検は予定されていません"
    },
    history: {
      title: "車両履歴",
      maintenanceTitle: "完了したメンテナンス",
      inspectionTitle: "完了した点検",
      noRecords: "履歴記録が見つかりません",
      noMaintenanceRecords: "完了したメンテナンス記録がありません",
      noInspectionRecords: "完了した点検記録がありません",
      inspection: "点検",
      maintenance: "メンテナンス"
    },
    deleteDialog: {
      title: "車両を削除",
      description: "この操作は元に戻せません。車両が完全に削除され、サーバーから削除されます。"
    },
    inProgress: {
      title: "進行中のタスク",
      maintenanceTitle: "進行中のメンテナンス",
      inspectionsTitle: "進行中の点検",
      noTasks: "進行中のタスクはありません"
    },
    allVehicles: "すべての車両",
    status: {
      active: "アクティブ",
      inactive: "非アクティブ",
      maintenance: "メンテナンス中"
    },
    noImage: "画像なし",
    detailsPage: {
      titleFallback: "車両詳細",
      descriptionFallback: "車両詳細を表示"
    }
  },
  maintenance: {
    title: "メンテナンス",
    description: "車両のメンテナンスタスクを管理します",
    actions: {
      markComplete: "完了としてマーク",
      markInProgress: "進行中としてマーク",
      startTask: "タスクを開始",
      cancel: "タスクをキャンセル",
      edit: "タスクを編集",
      delete: "タスクを削除"
    }
  },
  dashboard: {
    title: "ダッシュボード",
    description: "車両フリートの概要",
    quickActions: {
      title: "クイックアクション",
      description: "一般的なタスクとアクション",
      addVehicle: "車両を追加",
      scheduleMaintenance: "メンテナンスを予約",
      scheduleInspection: "点検を作成",
      createQuotation: "見積もりを作成",
      viewReports: "レポートを表示"
    },
    activityFeed: {
      title: "アクティビティフィード",
      description: "最近および今後のアクティビティ",
      noUpcoming: "今後のアクティビティはありません",
      noRecent: "最近のアクティビティはありません",
      viewAll: "すべて表示"
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
      description: "レビューおよび割り当て待ちの予約",
      viewAll: "すべての予約を表示",
      loadError: "今後の予約の読み込みに失敗しました",
      empty: {
        message: "今後の予約はありません"
      },
      nextLabel: "次"
    }
  },
  bookings: {
    title: "予約",
    description: "車両予約を表示・管理します",
    backToBooking: "予約に戻る"
  },
  quotations: {
    title: "見積もり",
    description: "顧客の見積もりを管理します"
  },
  pricing: {
    title: "価格管理",
    description: "サービス価格、プロモーション、パッケージを管理します"
  },
  fuel: {
    title: "燃料ログ",
    description: "車両の燃料消費と経費を追跡します。",
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
    description: "車両の走行距離とトリップを追跡します。",
    messages: {
      created: "走行距離ログが正常に作成されました",
      updated: "走行距離ログが正常に更新されました",
      deleted: "走行距離ログが正常に削除されました",
      error: "問題が発生しました"
    },
    loadingLogs: "走行距離ログを読み込み中..."
  },
  errors: {
    failedToLoadData: "{entity}の読み込みに失敗しました",
    pleaseTryAgainLater: "後でもう一度お試しください。"
  }
};

export default ja;