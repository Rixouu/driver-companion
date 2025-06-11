import { TranslationValue } from "../types";

export const ja: TranslationValue = {
  common: {
    status: {
      inProgress: "進行中",
      upcoming: "予定",
      recent: "最近",
      active: "アクティブ",
      inactive: "非アクティブ",
      completed: "完了",
      scheduled: "予定済み",
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
      default: "アクション"
    },
    actionsMenu: {
      default: "アクション",
      goHome: "ホームに移動",
      tryAgain: "再試行",
      chat: "チャット"
    },
    viewDetails: "詳細を表示",
    addNew: "新規追加",
    backTo: "戻る",
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
    send: "メール送信",
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
    formHasErrors: "送信前にフォームのエラーを修正してください",
    exportPDF: "PDF出力",
    exportCSV: "CSV出力",
    notAvailable: "利用不可",
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
    // Flat keys for direct access
    duplicate: "複製",
    active: "アクティブ", 
    inactive: "非アクティブ",
    showingResults: "全{total}件中{start}-{end}件を表示",
    nameEn: "名前（英語）",
    nameJa: "名前（日本語）",
    descriptionEn: "説明（英語）",
    descriptionJa: "説明（日本語）",
    order: "順序",
    add: "追加",
    clearFilters: "フィルターをクリア",
    empty: {
      title: "見積書がまだありません",
      description: "システムに見積書がありません。",
      noResultsTitle: "見積書が見つかりません",
      noResultsDescription: "フィルターに一致する見積書は見つかりませんでした。",
      cta: "見積書を作成"
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
    quotations: "見積書",
    pricing: "料金設定",
    dispatch: "配車",
    assignments: "割り当て",
    maintenance: "メンテナンス",
    inspections: "点検",
    reporting: "レポート",
    settings: "設定",
    fleet: "車両管理",
    sales: "営業",
    operations: "運営",
    logout: "ログアウト",
    scheduleInspection: "検査の作成",
    createQuotation: "見積もり作成",
    viewReports: "レポート表示"
  },
  quotations: {
    title: "見積書",
    description: "お客様の見積書を管理",
    create: "見積書作成",
    edit: {
      title: "見積書編集",
      description: "見積書の詳細を変更"
    },
    view: "見積書表示",
    duplicate: "複製",
    placeholder: "見積書が見つかりません",
    list: "すべての見積書",
    listDescription: "お客様の見積書を管理・追跡",
    actions: {
      view: "表示",
      edit: "編集",
      delete: "削除",
      send: "送信",
      copy: "コピー",
      duplicate: "複製",
      remind: "リマインダー送信",
      print: "印刷",
      download: "PDF ダウンロード",
      downloadPdf: "PDF ダウンロード",
      email: "見積書をメール送信",
      emailQuote: "見積書をメール送信",
      generating: "生成中..."
    },
    emailDescription: "見積書をPDF添付でお客様のメールアドレスに送信します。",
    includeDetails: "見積書詳細を含める",
    emailModal: {
      title: "見積書をメールで送信",
      description: "この見積書をお客様にメールで送信",
      emailLabel: "お客様メールアドレス",
      emailPlaceholder: "お客様のメールアドレスを入力",
      subjectLabel: "メール件名",
      messageLabel: "追加メッセージ（オプション）",
      messagePlaceholder: "お客様への個人的なメッセージを追加",
      sendButton: "メール送信",
      cancelButton: "キャンセル"
    },
    status: {
      draft: "下書き",
      sent: "送信済み",
      approved: "承認済み",
      rejected: "却下",
      expired: "期限切れ",
      converted: "予約に変換済み"
    },
    details: {
      title: "見積書詳細",
      description: "見積書の詳細を表示・管理",
      selectedServices: "選択されたサービス",
      vehicle: "車両",
      duration: "所要時間",
      days: "日",
      hours: "時間",
      date: "日付",
      time: "時刻",
      timeAdjustment: "時間調整",
      overtime: "時間外料金",
      discount: "割引",
      packageService: "パッケージサービス",
      includedServices: "含まれるサービス",
      pricingSummary: "料金概要",
      finalPricingBreakdown: "最終料金内訳",
      servicesBaseTotal: "サービス基本合計",
      timeBasedAdjustments: "時間ベース調整",
      packageTotal: "パッケージ合計",
      totalAmount: "合計金額",
      promotionDiscount: "プロモーション割引",
      regularDiscount: "通常割引",
      subtotal: "小計",
      tax: "税",
      total: "合計",
      activityFeed: "アクティビティフィード",
      quotationInfoStatus: "見積書情報ステータス",
      approvalPanel: {
        title: "見積書承認",
        approveButton: "見積書承認",
        rejectButton: "見積書却下",
        approveConfirmation: "この見積書を承認してもよろしいですか？",
        rejectConfirmation: "この見積書を却下してもよろしいですか？",
        description: "この見積書を確認し、進行を承認するか詳細なフィードバックで却下してください。",
        approveDescription: "この見積書を確認し、予約に進むために承認してください。",
        rejectDescription: "この見積書を確認し、詳細なフィードバックで却下してください。",
        notesLabel: "備考（オプション）",
        notesPlaceholder: "あなたの判断について備考やコメントを追加",
        reasonLabel: "却下理由",
        reasonPlaceholder: "この見積書を却下する理由を提供してください",
        approvalSuccess: "見積書が正常に承認されました",
        rejectionSuccess: "見積書が正常に却下されました"
      }
    },
    listColumns: {
      id: "ID",
      customer: "お客様",
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
      deleteConfirmation: "この見積書を削除してもよろしいですか？",
      error: "エラー",
      success: "成功",
      sendSuccess: "見積書が送信されました",
      updateAndSendSuccess: "更新された見積書が送信されました",
      partialSuccess: "部分的成功",
      emailFailed: "メール送信は完了しましたが、ステータス更新に失敗しました",
      approveSuccess: "見積書が正常に承認されました",
      rejectSuccess: "見積書が正常に却下されました",
      convertSuccess: "見積書が予約に正常に変換されました"
    }
  },
  settings: {
    title: "設定",
    description: "アカウント設定と環境設定を管理",
    preferences: {
      title: "環境設定",
      description: "アプリケーションの表示をカスタマイズ",
      language: {
        title: "言語",
        en: "English",
        ja: "日本語"
      }
    },
    menu: {
      title: "メニュー設定",
      description: "ナビゲーションに表示されるメニュー項目をカスタマイズ",
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
      pricing: "料金設定",
      assignments: "割り当て",
      save: "変更を保存"
    },
    templates: {
      title: "点検テンプレート",
      description: "点検フォームの構造（セクションと項目）を管理",
      manageTitle: "{type}テンプレートの管理",
      managerDescription: "{type}点検テンプレートを設定・カスタマイズします。セクションと項目を追加して点検プロセスを効率化できます。",
      createSuccess: "テンプレートタイプが正常に作成されました",
      createError: "テンプレートタイプの作成に失敗しました",
      nameRequired: "テンプレート名は必須です",
      slugRequired: "テンプレートスラグは必須です",
      invalidSlug: "無効なスラグ形式です。小文字、数字、ハイフンのみ使用してください",
      slugExists: "このスラグは既に存在します。別のものを使用してください",
      add: "テンプレートタイプを追加",
      addTemplate: "新しいテンプレートタイプを追加",
      addTemplateDescription: "新しい点検テンプレートタイプを作成",
      templateName: "テンプレート名",
      templateNamePlaceholder: "英語でテンプレート名を入力",
      templateNamePlaceholderJa: "テンプレート名を日本語で入力",
      templateSlug: "テンプレートスラグ",
      templateSlugPlaceholder: "URL対応識別子を入力",
      templateSlugDescription: "小文字、数字、ハイフンのみ",
      duplicate: "テンプレートを複製",
      duplicateTemplate: "テンプレートを複製",
      duplicateSuccess: "テンプレートが正常に複製されました",
      duplicateError: "テンプレートの複製に失敗しました",
      deleteTemplate: "テンプレートを削除",
      deleteTemplateConfirm: "このテンプレートを削除してもよろしいですか？この操作は元に戻せません。",
      deleteSuccess: "テンプレートが正常に削除されました",
      deleteError: "テンプレートの削除に失敗しました",
      managementSummary: "{count}個のセクションが設定済み",
      noSectionsConfigured: "まだセクションが設定されていません",
      emptyStateDescription: "このテンプレートにはまだセクションがありません。セクションは関連する点検項目を整理し、プロセスをより効率的にします。",
      emptyStateNote: "このテンプレートを設定するには管理者にお問い合わせください。",
      sectionNameLabel: "セクション名",
      sectionDescriptionLabel: "セクション説明",
      itemNameLabel: "項目名",
      itemDescriptionLabel: "項目説明"
    },
    tabs: {
      profile: "プロフィール",
      preferences: "環境設定",
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
      routine: "定期検査",
      safety: "安全検査", 
      maintenance: "整備検査",
      daily: "日常検査",
      test: "テスト検査",
      daily_checklist_toyota: "日次チェックリスト（トヨタ）",
      daily_checklist_mercedes: "日次チェックリスト（メルセデス）",
      select: "点検タイプを選択",
      description: {
        routine: "車両システムの包括的な点検",
        safety: "安全重要部品の重点点検",
        maintenance: "機械システムの詳細点検",
        daily: "必須部品の日常点検",
        test: "開発・トレーニング用のテスト点検テンプレート"
      }
    }
  },
  inspections: {
    title: "検査",
    description: "車両検査の管理と追跡",
    createInspection: "検査作成",
    createNewInspection: "新しい検査を作成",
    performInspection: "検査実行",
    unnamedInspection: "無名検査",
    noVehicle: "車両なし",
    noVehicleAssigned: "車両が割り当てられていません",
    noInspections: "検査が見つかりません",
    searchPlaceholder: "車両、ナンバープレート、またはタイプで検索...",
    overallNotes: "全体的な注意事項",
    dateLabel: "日付",
    typeLabel: "タイプ",
    statusLabel: "ステータス",
    inspectorLabel: "検査員",
    inspectorEmailLabel: "検査員メール",
    defaultType: "定期検査",
    type: {
      routine: "定期検査",
      safety: "安全検査", 
      maintenance: "整備検査",
      daily: "日常検査",
      test: "テスト検査",
      daily_checklist_toyota: "日次チェックリスト（トヨタ）",
      daily_checklist_mercedes: "日次チェックリスト（メルセデス）",
      unspecified: "未指定",
      description: {
        routine: "車両システムの包括的な点検",
        safety: "安全重要部品の重点点検",
        maintenance: "機械システムの詳細点検",
        daily: "必須部品の日常点検",
        test: "開発・トレーニング用のテスト点検テンプレート"
      }
    },
    status: {
      pending: "保留中",
      inProgress: "進行中",
      completed: "完了",
      failed: "不合格",
      scheduled: "予定済み",
      cancelled: "キャンセル済み"
    },
    statusValues: {
      completed: "完了",
      cancelled: "キャンセル済み"
    },
    fields: {
      vehicle: "車両",
      date: "日付",
      type: "タイプ",
      status: "ステータス",
      inspector: "検査員",
      notes: "注記"
    },
    quickStats: {
      todaysInspections: "本日の検査",
      pendingInspections: "保留中の検査",
      weeklyCompleted: "今週完了",
      failedInspections: "不合格検査"
    },

    calendar: {
      title: "検査カレンダー",
      month: "月",
      week: "週",
      today: "今日",
      inspectionsOnDate: "{date}に{count}件の検査",
      noInspectionsOnDate: "この日に検査はありません",
      viewInspection: "検査を表示"
    },

    details: {
      printTitle: "車両検査報告書",
      vehicleInfoTitle: "車両情報",
      overviewTitle: "検査概要",
      summaryTitle: "検査サマリー",
      photosTitle: "写真（{count}枚）",
      photosTabDescription: "この検査中に撮影されたすべての写真",
      noPhotosMessage: "この検査中に写真は撮影されませんでした",
      photoForItem: "{itemName}の写真",
      photoItemAlt: "{itemName}の検査写真",
      viewPhotoAria: "{itemName}の写真を表示",
      
      tabs: {
        details: "すべての項目",
        failed: "不合格",
        passed: "合格",
        photos: "写真"
      },

      allItemsTitle: "すべての検査項目（{count}件）",
      failedItemsTitle: "不合格項目（{count}件）",
      passedItemsTitle: "合格項目（{count}件）",

      summaryPassed: "合格",
      summaryFailed: "不合格",
      summaryNotes: "メモあり",
      summaryPhotos: "写真",
      passRate: "合格率",
      attentionRequired: "要注意",
      itemsNeedAttention: "{count}項目に注意が必要",

      vehicleInfo: {
        title: "車両情報"
      },

      summary: {
        title: "検査サマリー",
        passedItems: "合格項目",
        failedItems: "不合格項目",
        itemsWithNotes: "メモ付き項目",
        photosTaken: "撮影写真"
      },

      items: {
        title: "検査項目"
      },

      results: {
        allPassed: "すべての項目が合格",
        noPassedItems: "合格項目はありません",
        noItems: "検査項目が見つかりません",
        noItemsInStatus: "{status}ステータスの項目が見つかりません",
        noPendingItems: "保留中の項目はありません",
        itemStatus: "項目ステータス",
        passed: "合格",
        failed: "不合格",
        pending: "保留中",
        withNotes: "メモあり",
        withPhotos: "写真あり",
        expandPhotos: "写真を表示",
        collapsePhotos: "写真を非表示"
      },

      pdfFooter: {
        generatedOn: "{date}に生成",
        vehicleName: "車両: {name}"
      },

      repairNeededTitle: "修理が必要",
      repairNeededDescription: "この検査には修理またはメンテナンスが必要な不合格項目があります。",
      repairNeededFor: "修理が必要",
      defaultRepairDescription: "検査結果に基づく修理が必要",
      repairTaskTitle: "{inspectionName}の修理 - {vehicleName}",
      andMoreItems: "および{count}項目以上",
      unknownItem: "不明な項目",
      pdfDownloaded: "PDFが正常にダウンロードされました",
      csvDownloaded: "CSVが正常にダウンロードされました",
      submitSuccessTitle: "検査が送信されました",
      submitSuccessDescription: "検査結果が正常に送信されました。",
      submitErrorTitle: "送信に失敗しました",
      genericSubmitError: "検査の送信中にエラーが発生しました。再度お試しください。"
    },

    actions: {
      pass: "合格",
      fail: "不合格",
      takePhoto: "写真を撮影",
      previousSection: "前のセクション",
      nextSection: "次のセクション",
      startInspection: "検査開始",
      continueInspection: "検査を続行",
      completeInspection: "検査完了",
      scheduleRepair: "修理予約",
      printReport: "レポート印刷",
      exportHtml: "CSV出力",
      exportPdf: "PDF出力",
      viewDetails: "詳細を表示"
    },

    notes: {
      title: "検査員メモ",
      placeholder: "この検査についてのメモを追加...",
      itemNotes: "項目メモ"
    },

    photos: {
      title: "検査写真",
      addPhoto: "写真を追加",
      viewPhoto: "写真を表示",
      deletePhoto: "写真を削除",
      noPhotos: "写真が追加されていません"
    },

    form: {
      title: "車両検査",
      selectVehicle: "車両を選択",
      selectType: "検査タイプを選択",
      searchVehicles: "車両を検索...",
      filterByBrand: "ブランドでフィルター",
      filterByModel: "モデルでフィルター", 
      filterByGroup: "グループでフィルター",
      allBrands: "すべてのブランド",
      allModels: "すべてのモデル",
      allGroups: "すべてのグループ",
      clearFilters: "フィルターをクリア",
      noVehiclesFound: "車両が見つかりません",
      vehicleSelected: "車両選択済み",
      typeSelected: "タイプ選択済み",
      startInspection: "検査開始",
      
      progress: {
        vehicleSelection: "車両選択",
        typeSelection: "タイプ選択", 
        inspection: "検査",
        completion: "完了"
      },

      steps: {
        selectVehicle: "検査する車両を選択",
        selectType: "実行する検査タイプを選択",
        performInspection: "検査チェックリストを完了",
        reviewAndSubmit: "検査内容を確認して提出"
      },

      inspection: {
        section: "セクション{current}/{total}",
        item: "項目{current}/{total}",
        progress: "進捗: {percent}%",
        estimatedTime: "残り約{minutes}分",
        pass: "合格",
        fail: "不合格",
        addNote: "メモを追加",
        takePhoto: "写真を撮影",
        next: "次へ",
        previous: "前へ",
        previousSection: "前のセクション",
        nextSection: "次のセクション",
        complete: "検査完了",
        notes: "メモ",
        photos: "写真",
        requiredPhoto: "写真必須",
        requiredNotes: "メモ必須",
        optionalPhoto: "写真任意",
        optionalNotes: "メモ任意"
      }
    },

    // Add labels section for backward compatibility
    labels: {
      model: "モデル",
      currentSection: "現在のセクション",
      estimatedTime: "推定時間"
    },

    templates: {
      title: "点検テンプレート",
      assign: "割り当て",
      addSection: "セクション追加",
      addItem: "項目追加",
      newSectionTitle: "新しいセクションを追加",
      newSectionDescription: "この検査テンプレートに新しいセクションを作成",
      newItemTitle: "新しい項目を追加",
      newItemDescription: "このセクションに新しい検査項目を追加",
      editSectionTitle: "セクション編集",
      editSectionDescription: "セクション情報を更新",
      editItemTitle: "検査項目編集",
      editItemDescription: "検査項目の詳細を更新",
      manageTitle: "{type}テンプレートの管理",
      managerDescription: "{type}検査テンプレートを設定・カスタマイズします。セクションと項目を追加して検査プロセスを効率化しましょう。",
      managementSummary: "{count}個のセクションが設定済み",
      noSectionsConfigured: "まだセクションが設定されていません",
      emptyStateDescription: "このテンプレートにはまだセクションがありません。セクションは関連する検査項目を整理し、プロセスをより効率的にします。",
      emptyStateNote: "このテンプレートを設定するには管理者にお問い合わせください。",
      sectionNameLabel: "セクション名",
      sectionDescriptionLabel: "セクション説明",
      itemNameLabel: "項目名",
      itemDescriptionLabel: "項目説明",
      sectionNamePlaceholder: "セクション名を入力",
      sectionDescriptionPlaceholder: "セクション説明を入力（オプション）",
      itemNamePlaceholder: "項目名を入力",
      itemDescriptionPlaceholder: "項目説明を入力（オプション）",
      requiresPhoto: "写真が必要",
      requiresNotes: "注記が必要",
      noSections: "セクションが見つかりません。最初のセクションを作成してください。",
      addSectionSuccess: "セクションが正常に追加されました",
      addSectionError: "セクションの追加エラー",
      editSectionSuccess: "セクションが正常に更新されました",
      editSectionError: "セクションの更新エラー",
      deleteSectionSuccess: "セクションが正常に削除されました",
      deleteSectionError: "セクションの削除エラー",
      deleteSectionErrorNotEmpty: "項目を含むセクションは削除できません",
      deleteSectionConfirm: "このセクションを削除してもよろしいですか？",
      addItemSuccess: "項目が正常に追加されました",
      addItemError: "項目の追加エラー",
      editItemSuccess: "項目が正常に更新されました",
      editItemError: "項目の更新エラー",
      deleteItemSuccess: "項目が正常に削除されました",
      deleteItemError: "項目の削除エラー",
      deleteItemErrorInUse: "検査で使用中の項目は削除できません",
      deleteItemConfirm: "この項目を削除してもよろしいですか？",
      itemNameRequired: "項目名は少なくとも一つの言語で必須です",
      sectionNameRequired: "セクション名は少なくとも一つの言語で必須です",
      itemNotFound: "項目が見つかりません",
      tabs: {
        templates: "テンプレート",
        assignments: "割り当て"
      },
      assignments: {
        title: "テンプレート割り当て",
        description: "特定の車両やグループが使用する検査テンプレートを管理",
        templateDescription: "{template}検査テンプレートを使用する車両とグループを設定",
        assignTemplateTitle: "{template}テンプレートの割り当て",
        assignTemplateDescription: "検査で{template}テンプレートを使用する車両と車両グループを選択",
        manage: "割り当て管理",
        assignedCount: "{count}件の割り当て",
        notAssigned: "車両またはグループに割り当てられていません",
        selectVehicles: "車両を選択",
        selectVehiclesPlaceholder: "車両を選択...",
        vehiclesHelpText: "このテンプレートを使用する個別の車両を選択",
        selectGroups: "車両グループを選択",
        selectGroupsPlaceholder: "車両グループを選択...",
        groupsHelpText: "車両グループを選択 - これらのグループ内のすべての車両がこのテンプレートを使用します",
        assignedVehicles: "割り当て済み車両",
        assignedGroups: "割り当て済み車両グループ",
        saveSuccess: "テンプレート割り当てが正常に保存されました",
        saveError: "テンプレート割り当ての保存に失敗しました"
      },
      activation: {
        title: "テンプレートの有効化",
        activate: "テンプレートを有効化",
        deactivate: "テンプレートを無効化",
        activateConfirm: "このテンプレートを有効化してもよろしいですか？",
        deactivateConfirm: "このテンプレートを無効化してもよろしいですか？",
        activateSuccess: "テンプレートが正常に有効化されました",
        deactivateSuccess: "テンプレートが正常に無効化されました",
        activateError: "テンプレートの有効化エラー",
        deactivateError: "テンプレートの無効化エラー",
        status: "ステータス",
        active: "有効",
        inactive: "無効",
        activeDescription: "このテンプレートは現在有効で、使用可能です",
        inactiveDescription: "このテンプレートは現在無効で、ユーザーには表示されません"
      },
      vehicleAssignment: {
        title: "車両割り当て",
        description: "このテンプレートを特定の車両または車両グループに割り当て",
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
        noAssignments: "車両またはグループに割り当てられていません",
        assignSuccess: "テンプレートが正常に割り当てられました",
        assignError: "テンプレートの割り当てエラー",
        unassignSuccess: "テンプレートの割り当てが正常に解除されました",
        unassignError: "テンプレート割り当て解除エラー"
      },
      vehicleGroups: {
        title: "車両グループ",
        description: "テンプレート管理を簡単にするために車両をグループに整理",
        create: "車両グループを作成",
        edit: "車両グループを編集",
        delete: "車両グループを削除",
        name: "グループ名",
        nameDescription: "この車両グループの説明的な名前",
        namePlaceholder: "例：セダン車両、配送トラック",
        groupDescription: "説明",
        descriptionPlaceholder: "このグループの説明を入力",
        color: "色",
        colorDescription: "このグループを識別する色を選択",
        vehicles: "車両",
        vehicleCount: "{count}台の車両",
        noVehicles: "このグループに車両がありません",
        addVehicles: "車両を追加",
        removeVehicle: "グループから削除",
        createSuccess: "車両グループが正常に作成されました",
        updateSuccess: "車両グループが正常に更新されました",
        deleteSuccess: "車両グループが正常に削除されました",
        createError: "車両グループの作成エラー",
        updateError: "車両グループの更新エラー",
        deleteError: "車両グループの削除エラー",
        deleteConfirm: "この車両グループを削除してもよろしいですか？",
        deleteWarning: "これによりすべての車両からグループ割り当てが削除されますが、車両自体は削除されません。",
        assignVehicles: "車両をグループに割り当て",
        unassignVehicle: "車両をグループから削除",
        groupAssignments: "グループ割り当て",
        moveToGroup: "グループに移動",
        ungrouped: "グループ化されていない車両"
      },
      copyTemplate: {
        title: "テンプレートをコピー",
        description: "特定の車両またはグループ用にこのテンプレートのコピーを作成",
        copyForGroup: "車両グループ用にコピー",
        copyForVehicle: "特定の車両用にコピー",
        selectTarget: "対象を選択",
        copySuccess: "テンプレートが正常にコピーされました",
        copyError: "テンプレートのコピーエラー",
        customizeAfterCopy: "選択した対象に対してこのテンプレートをカスタマイズできます"
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
    messages: {
      exportSuccess: "エクスポート成功",
      pdfDownloaded: "PDFが正常にダウンロードされました"
    }
  },
  inspectionTemplates: {
    title: "検査テンプレート",
    description: "検査テンプレートと割り当てを管理",
    createTemplate: "テンプレート作成",
    editTemplate: "テンプレート編集",
    duplicateTemplate: "テンプレート複製",
    deleteTemplate: "テンプレート削除",
    renameTemplate: "テンプレート名変更",
    templateType: "テンプレートタイプ",
    templateName: "テンプレート名",
    newTemplateName: "新しいテンプレート名",
    newTemplateType: "新しいテンプレートタイプ",
    searchTemplates: "タイプでテンプレートを検索...",
    noTemplatesFound: "テンプレートが見つかりません",
    noTemplatesDescription: "最初の検査テンプレートを作成して開始しましょう。",
    noSearchResults: "検索条件に一致するテンプレートがありません。",
    addSection: "セクション追加",
    
    template: {
      sections: "セクション",
      items: "項目", 
      vehicles: "車両",
      groups: "グループ",
      active: "アクティブ",
      inactive: "非アクティブ"
    },

    assignment: {
      title: "テンプレート割り当て",
      description: "車両またはグループにテンプレートを割り当て",
      vehicleGroups: "車両グループ",
      individualVehicles: "個別車両",
      addGroup: "グループを追加",
      noGroupsAvailable: "利用可能な車両グループがありません",
      noVehiclesAvailable: "利用可能な車両がありません",
      assignSuccess: "テンプレートの割り当てが完了しました",
      unassignSuccess: "テンプレートの割り当て解除が完了しました",
      assignError: "テンプレートの割り当てに失敗しました",
      unassignError: "テンプレートの割り当て解除に失敗しました"
    },

    sections: {
      title: "テンプレートセクション",
      addSection: "セクション追加",
      editSection: "セクション編集",
      deleteSection: "セクション削除",
      deleteSections: "{count}セクションを削除",
      sectionName: "セクション名",
      sectionDescription: "セクション説明",
      activeSection: "アクティブセクション",
      unnamedSection: "無名セクション",
      noItemsInSection: "このセクションに項目がありません",
      orderNumber: "順序番号"
    },

    items: {
      addItem: "項目追加",
      editItem: "項目編集", 
      deleteItem: "項目削除",
      itemName: "項目名",
      itemDescription: "項目説明",
      requiresPhoto: "写真必須",
      requiresNotes: "メモ必須",
      photo: "写真",
      notes: "メモ",
      unnamedItem: "無名項目"
    },

    groups: {
      title: "車両グループ",
      create: "車両グループ作成",
      edit: "車両グループ編集",
      delete: "車両グループ削除",
      manage: "車両管理",
      groupName: "グループ名",
      groupDescription: "説明",
      groupColor: "色",
      noGroups: "車両グループが見つかりません",
      vehicleCount: "{count}台",
      addVehicles: "車両追加",
      removeVehicles: "車両削除",
      manageVehiclesInGroup: "グループ内車両管理",
      vehiclesInGroup: "グループ内車両",
      availableVehicles: "利用可能車両",
      ungroupedVehicles: "未グループ車両",
      groupColorDescription: "このグループを識別する色を選択してください"
    },

    dialogs: {
      createTemplate: {
        title: "新しいテンプレート作成",
        description: "新しい検査テンプレートタイプを作成",
        templateTypePlaceholder: "例: routine, safety, maintenance"
      },
      
      editTemplate: {
        title: "テンプレート名変更",
        description: "テンプレートタイプ名を変更",
        currentName: "現在の名前",
        newName: "新しい名前"
      },

      duplicateTemplate: {
        title: "テンプレート複製",
        description: "このテンプレートのコピーを作成",
        sourceTemplate: "元テンプレート",
        targetType: "新しいテンプレートタイプ",
        targetTypePlaceholder: "新しいテンプレートタイプ名を入力"
      },

      deleteConfirm: {
        title: "{type}を削除しますか？",
        template: "テンプレート\"{name}\"を削除しますか？",
        section: "セクション\"{name}\"を削除しますか？",
        item: "項目\"{name}\"を削除しますか？",
        templateDescription: "これにより、このテンプレート内の{sections}セクションと{items}項目がすべて完全に削除されます。この操作は元に戻せません。",
        sectionDescription: "これにより、このセクションとその中の{items}項目がすべて完全に削除されます。この操作は元に戻せません。",
        itemDescription: "この検査項目が完全に削除されます。この操作は元に戻せません。",
        cannotBeUndone: "この操作は元に戻せません。"
      },

      section: {
        create: "新しいセクション作成",
        edit: "セクション編集",
        nameEn: "名前（英語）",
        nameJa: "名前（日本語）",
        nameEnPlaceholder: "例: Engine Check",
        nameJaPlaceholder: "例: エンジン点検",
        descriptionEn: "説明（英語）",
        descriptionJa: "説明（日本語）",
        isActive: "アクティブセクション"
      },

      vehicleGroup: {
        create: "車両グループ作成", 
        edit: "車両グループ編集",
        name: "グループ名",
        namePlaceholder: "例: 配送トラック",
        description: "説明",
        descriptionPlaceholder: "任意の説明",
        color: "色",
        selectColor: "グループ色を選択"
      },

      manageVehicles: {
        title: "{groupName}の車両管理",
        description: "このグループの車両を追加または削除",
        currentVehicles: "現在の車両（{count}台）",
        availableVehicles: "利用可能車両",
        noCurrentVehicles: "このグループに車両がありません",
        noAvailableVehicles: "追加可能な車両がありません",
        addSelected: "選択を追加",
        removeSelected: "選択を削除"
      }
    },

    actions: {
      showAssignments: "割り当て表示",
      hideAssignments: "割り当て非表示",
      selectAll: "すべて選択",
      deselectAll: "すべて選択解除",
      bulkDelete: "一括削除"
    },

    messages: {
      templateCreated: "テンプレートが作成されました",
      templateUpdated: "テンプレートが更新されました", 
      templateDeleted: "テンプレートが削除されました",
      templateDuplicated: "テンプレートが複製されました",
      templateRenamed: "テンプレート名が変更されました",
      sectionCreated: "セクションが作成されました",
      sectionUpdated: "セクションが更新されました",
      sectionDeleted: "セクションが削除されました",
      sectionsDeleted: "{count}セクションが削除されました",
      itemCreated: "項目が作成されました",
      itemUpdated: "項目が更新されました",
      itemDeleted: "項目が削除されました",
      sectionsReordered: "セクションの並び順が変更されました",
      itemsReordered: "アイテムの並び順が変更されました",
      vehicleGroupCreated: "車両グループが作成されました",
      vehicleGroupUpdated: "車両グループが更新されました",
      vehicleGroupDeleted: "車両グループが削除されました",
      vehiclesAdded: "{count}台の車両がグループに追加されました",
      vehiclesRemoved: "{count}台の車両がグループから削除されました",
      
      errors: {
        templateNameRequired: "テンプレートタイプは必須です",
        sectionNameRequired: "セクション名（英語）は必須です",
        groupNameRequired: "グループ名は必須です",
        templateCreateFailed: "テンプレートの作成に失敗しました",
        templateUpdateFailed: "テンプレートの更新に失敗しました",
        templateDeleteFailed: "テンプレートの削除に失敗しました",
        templateDuplicateFailed: "テンプレートの複製に失敗しました",
        sectionCreateFailed: "セクションの作成に失敗しました",
        sectionUpdateFailed: "セクションの更新に失敗しました",
        sectionDeleteFailed: "セクションの削除に失敗しました",
        itemCreateFailed: "項目の作成に失敗しました",
        itemAddFailed: "項目の追加に失敗しました",
        itemUpdateFailed: "項目の更新に失敗しました",
        itemDeleteFailed: "項目の削除に失敗しました",
        vehicleGroupCreateFailed: "車両グループの作成に失敗しました",
        vehicleGroupUpdateFailed: "車両グループの更新に失敗しました", 
        vehicleGroupDeleteFailed: "車両グループの削除に失敗しました",
        vehicleGroupHasAssignments: "アクティブなテンプレート割り当てがあるグループは削除できません",
        loadTemplatesFailed: "テンプレートの読み込みに失敗しました",
        loadVehiclesFailed: "車両の読み込みに失敗しました",
        loadAssignmentsFailed: "割り当ての読み込みに失敗しました",
        assignmentFailed: "割り当ての更新に失敗しました",
        reorderFailed: "並び替えに失敗しました",
        deleteMultipleFailed: "複数セクションの削除に失敗しました",
        partialDeleteSuccess: "一部のセクションが正常に削除されました"
      },

      confirmations: {
        noSectionsSelected: "削除するセクションが選択されていません",
        deleteMultipleSections: "{count}個のセクションを削除してもよろしいですか？これらのセクション内のすべての項目も削除されます。",
        deleteTemplate: "このテンプレートを削除してもよろしいですか？すべてのセクションと項目が削除されます。",
        deleteSection: "このセクションを削除してもよろしいですか？このセクション内のすべての項目も削除されます。",
        deleteItem: "この項目を削除してもよろしいですか？",
        deleteVehicleGroup: "この車両グループを削除してもよろしいですか？"
      },

      mobile: {
        showAssignments: "割り当て",
        showSections: "セクション",
        backToTemplates: "テンプレートに戻る",
        templateInfo: "テンプレート情報",
        assignTo: "割り当て先",
        manageItems: "項目管理"
      }
    }
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
  groups: {
    title: "車両グループ",
    noGroups: "車両グループが見つかりません",
    allGroups: "すべてのグループ",
    filter: "グループでフィルター"
  },

  pagination: {
    page: "ページ {page}",
    of: "/ {total}",
    showing: "{start}-{end}件を表示（全{total}件）"
  },

  labels: {
    showingVehicles: "{start}-{end}台を表示（全{total}台）"
  },

  steps: {
    selectType: "検査タイプを選択"
  },

  expiringQuotations: {
    title: "期限切れ間近の見積もり",
    description: "今後7日以内に期限が切れる見積もり。",
    amount: "金額",
    expiringTomorrow: "明日期限切れ",
    expiringInDays: "{days}日後に期限切れ",
    viewAll: "すべて表示"
  },

  activityFeed: {
    title: "アクティビティフィード",
    description: "最近および今後のアクティビティ"
  },

  dashboard: {
    title: "ダッシュボード",
    description: "車両フリートの概要",
    quickActions: {
      title: "クイックアクション",
      description: "一般的なタスクとアクション",
      addVehicle: "車両を追加",
      scheduleMaintenance: "メンテナンスをスケジュール",
      scheduleInspection: "検査を作成",
      createQuotation: "見積もりを作成",
      viewReports: "レポートを表示"
    },
    expiringQuotations: {
      title: "期限切れ間近の見積もり",
      description: "今後7日以内に期限が切れる見積もり。",
      amount: "金額",
      expiringTomorrow: "明日期限切れ",
      expiringInDays: "{days}日後に期限切れ",
      viewAll: "すべて表示"
    },
    activityFeed: {
      title: "アクティビティフィード",
      description: "最近および今後のアクティビティ"
    }
  }
};

export default ja;