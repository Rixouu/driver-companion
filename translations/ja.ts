export const ja = {
  common: {
    back: "戻る",
    cancel: "キャンセル",
    save: "保存",
    edit: "編集",
    delete: "削除",
    loading: "読み込み中...",
    required: "必須",
    logout: "ログアウト",
    days: "日",
    completed: "完了",
    search: "検索",
    filter: "フィルター",
    actions: "アクション",
    date: "日付",
    welcome: "ようこそ",
    overview: "車両点検の概要です",
    upcomingTasks: "今後の予定",
    viewAll: "すべて表示",
    alerts: "アラート",
    pendingInspections: "保留中の点検",
    completedToday: "本日完了",
    requiresAttention: "要対応",
    recentInspections: "最近の点検",
    success: "成功",
    error: "エラー",
    view: "表示",
    clear: "クリア",
    apply: "適用",
    confirm: "確認",
    noData: "データがありません",
    optional: "任意",
    select: "選択",
    time: "時間",
    notes: "メモ",
    description: "説明",
    warning: "警告",
    info: "お知らせ",
    ui: {
      modal: {
        close: "閉じる",
        confirm: "確認",
        cancel: "キャンセル"
      },
      dropdown: {
        select: "選択...",
        noOptions: "オプションがありません",
        search: "検索...",
        all: "すべて",
        none: "なし"
      },
      table: {
        noData: "データがありません",
        loading: "データを読み込み中...",
        search: "検索...",
        rowsPerPage: "表示件数",
        showing: "{total}件中{start}から{end}件を表示"
      },
      fileUpload: {
        drag: "ファイルをドラッグ＆ドロップ",
        or: "または",
        browse: "ファイルを選択",
        maxSize: "最大ファイルサイズ: {size}",
        invalidType: "無効なファイル形式",
        uploading: "アップロード中...",
        uploaded: "アップロード完了",
        failed: "アップロード失敗"
      }
    }
  },
  status: {
    // Common statuses
    active: "稼働中",
    inactive: "非稼働",
    pending: "保留中",
    completed: "完了",
    cancelled: "キャンセル",
    inProgress: "進行中",
    approved: "承認済み",
    rejected: "却下",
    archived: "アーカイブ済み",
    scheduled: "予定済み",

    // Vehicle statuses
    vehicleStatus: {
      maintenance: "メンテナンス中",
      inspectionDue: "点検予定",
      active: "稼働中",
      inactive: "非稼働"
    },

    // Inspection statuses
    inspectionStatus: {
      passed: "合格",
      failed: "不合格",
      na: "該当なし",
      inProgress: "点検中",
      scheduled: "予定済み",
      completed: "完了",
      cancelled: "キャンセル"
    },

    // Maintenance statuses
    maintenanceStatus: {
      scheduled: "予定済み",
      inProgress: "作業中",
      completed: "完了",
      overdue: "期限超過"
    }
  },
  navigation: {
    dashboard: "ダッシュボード",
    vehicles: "車両",
    inspections: "点検",
    settings: "設定",
  },
  dashboard: {
    title: "ドライバーダッシュボード",
    lastInspection: "前回の点検",
    inspectionRequired: "点検が必要です",
    startInspection: "点検開始",
    viewInspection: "点検詳細を見る",
    welcomeMessage: "ようこそ、{{name}}さん！",
    overview: {
      title: "車両の状態と予定されたタスク"
    },
    vehicle: {
      plateNumber: "ナンバープレート",
      nextInspection: "次回点検予定日",
      nextMaintenance: "次回整備予定日",
      startInspection: "点検を開始",
      status: {
        active: "稼働中",
        maintenance: "整備中",
        inspection_due: "点検必要",
      },
      actions: {
        startInspection: "点検を開始",
        reportIssue: "問題を報告",
        viewHistory: "履歴を表示",
      },
      mileage: "現在の走行距離",
      lastInspection: "前回の点検",
    },
    upcomingTasks: "予定されたタスク",
    tasks: {
      inspection: "車両点検",
      maintenance: "整備サービス",
      time: "{date} {time}",
    },
    alerts: {
      title: "アクティブなアラート",
      types: {
        inspection: "点検が{count}件必要です",
        maintenance: "整備が{count}件必要です",
      },
      priority: {
        high: "優先度：高",
        medium: "優先度：中",
        low: "優先度：低",
      }
    },
    priority: {
      high: "緊急",
      medium: "重要",
      low: "通常",
    },
    quickActions: {
      title: "クイックアクション",
      newInspection: "新規点検",
      scheduleInspection: "点検予約",
      addVehicle: "車両追加",
      viewReports: "レポート表示"
    },
    stats: {
      inspectionsThisMonth: "今月の点検数",
      passRate: "合格率",
      averageCompletion: "平均完了時間",
      vehiclesInService: "稼働中の車両"
    },
  },
  vehicles: {
    title: "車両一覧",
    addVehicle: "車両を追加",
    new: {
      title: "新規車両登録",
      description: "新しい車両の詳細を入力してください",
      form: {
        vehicleInfo: "車両情報",
        name: "車両名",
        plateNumber: "ナンバープレート",
        model: "モデル",
        year: "年式",
        vin: "車台番号",
        assignTo: "担当者",
        image: "車両画像",
        imageHelp: "車両の写真をアップロードしてください。対応形式：JPG、PNG",
      },
      actions: {
        add: "車両を追加",
        adding: "追加中...",
        cancel: "キャンセル",
      },
    },
    vehicleDetails: "車両詳細",
    model: "モデル",
    year: "年式",
    vin: "車台番号",
    assignedTo: "担当者",
    status: {
      active: "稼働中",
      inspection_due: "点検必要",
      maintenance: "メンテナンス中"
    },
    viewDetails: "詳細を見る",
    management: {
      assignVehicle: "車両割り当て",
      maintenance: {
        title: "メンテナンス管理",
        schedule: "メンテナンススケジュール",
        history: "メンテナンス履歴",
        nextService: "次回点検",
        lastService: "前回点検",
        addService: "点検記録を追加",
        addTaskTitle: "メンテナンスタスクを追加",
        addTaskDescription: "この車両の新しいメンテナンスタスクを予定する",
        selectType: "メンテナンス種別を選択",
        maintenanceTypes: {
          inspection: "点検",
          oilChange: "オイル交換",
          tireRotation: "タイヤローテーション",
          brakeService: "ブレーキ整備"
        },
        status: {
          scheduled: "予定済み",
          inProgress: "進行中",
          completed: "完了",
          cancelled: "キャンセル",
          overdue: "期限超過",
        },
        performedBy: "実施者",
        addTask: "メンテナンスタスクを追加",
        costs: {
          title: "費用概要",
          total: "総メンテナンス費用",
          average: "月平均費用",
          amount: "サービス費用"
        },
        reminders: {
          title: "点検リマインダー",
          enable: "リマインダーを有効化",
          before: "事前通知",
          notification: "通知タイプ",
          email: "メール",
          push: "プッシュ通知",
          both: "両方",
        },
        intervals: {
          title: "点検間隔",
          days: "日数",
          kilometers: "走行距離",
          next: "次回予定",
          overdue: "期限超過",
          upcoming: "予定",
        },
      },
      mileage: {
        title: "走行距離概要",
        current: "現在の走行距離",
        daily: "1日平均",
        monthly: "月間平均",
        update: {
          title: "走行距離を更新",
          reading: "現在の読み取り値",
          lastUpdate: "最終更新: {date}",
          notes: "メモ"
        },
        lastUpdate: "最終更新",
        alerts: {
          title: "走行距離アラート",
          upcomingService: "予定されている整備",
          overdueService: "期限超過の整備",
          status: {
            upcoming: "予定",
            overdue: "期限超過"
          }
        },
        tabs: {
          overview: "概要",
          history: "履歴",
          analysis: "分析",
          maintenanceSchedule: "整備スケジュール",
          inspectionHistory: "点検履歴",
          mileageCurrent: "現在の走行距離",
          fuelConsumption: "燃料消費",
          assignmentList: "割り当て一覧"
        },
        reading: "現在の走行距離",
        distance: "走行距離",
        goals: {
          title: "走行距離目標",
          monthly: "月間目標",
          yearly: "年間目標",
          current: "{current} / {target} km"
        },
        analysis: {
          title: "走行距離分析",
          stats: {
            lastDistance: "前回の走行距離",
            totalDistance: "総走行距離",
            averagePerTrip: "1回あたりの平均",
            projectedMonthly: "月間予測",
            weeklyComparison: "週間比較",
            averageSpeed: "平均速度"
          },
          metrics: {
            kilometers: "キロメートル",
            kmPerHour: "km/h",
            perDay: "1日あたり",
            perWeek: "週間比較"
          },
          chart: {
            weekly: "週間走行距離",
            monthly: "月間走行距離",
            comparison: "走行距離比較"
          }
        },
        totalDistance: "総走行距離",
        averagePerTrip: "1回あたりの平均",
        projectedMonthly: "月間予測",
        weeklyComparison: "週間比較",
        weeklyAverage: "週間平均",
        yearlyProjection: "年間予測",
        highestDaily: "1日の最高",
        averageSpeed: "平均速度",
        metrics: {
          kilometers: "キロメートル",
          days: "日"
        }
      },
      fuel: {
        consumption: "燃料消費",
        totalCost: "総燃料費",
        averageEfficiency: "平均燃費",
        addRecord: "給油記録追加",
        liters: "リットル",
        mileage: "給油時の走行距離",
        cost: "燃料費"
      },
      qrCode: {
        generate: "QRコード生成",
        download: "QRコードをダウンロード",
        print: "QRコードを印刷",
        scan: "QRコードをスキャン",
      },
      assignment: {
        title: "車両割り当て管理",
        current: {
          title: "現在の割り当て",
          noAssignment: "割り当てなし",
          driver: "担当ドライバー",
          since: "割り当て開始日",
          until: "割り当て終了日",
          assignmentHistory: "割り当て履歴",
          addAssignment: "割り当て追加",
          assignTo: "車両の割り当て先"
        },
        history: {
          title: "割り当て履歴",
          noHistory: "割り当て履歴なし",
          previousDrivers: "過去の担当ドライバー"
        },
        new: {
          title: "新規割り当て",
          selectDriver: "ドライバーを選択",
          period: "割り当て期間",
          notes: "割り当てメモ"
        },
        actions: {
          assign: "車両を割り当て",
          unassign: "割り当て解除",
          extend: "期間延長",
          terminate: "割り当て終了",
          addAssignment: "割り当てを追加"
        },
        status: {
          active: "稼働中",
          completed: "完了",
          scheduled: "予定",
          cancelled: "キャンセル"
        }
      },
      fuelConsumption: {
        title: "燃料消費",
        stats: {
          averageConsumption: "平均消費量",
          totalFuelCost: "総燃料費",
          lastRefuel: "最終給油",
          fuelEfficiency: "燃費"
        },
        metrics: {
          liters: "L",
          kmPerLiter: "km/L",
          costPerKm: "円/km"
        },
        chart: {
          consumption: "消費量",
          distance: "走行距離",
          cost: "費用",
          monthly: "月間消費量",
          yearly: "年間消費量"
        },
        refuel: {
          addRecord: "給油記録を追加",
          date: "給油日",
          amount: "給油量 (L)",
          cost: "費用",
          mileage: "給油時の走行距離",
          fullTank: "満タン",
          station: "給油所"
        }
      },
      maintenanceSchedule: {
        title: "メンテナンススケジュール",
        upcoming: "予定されているメンテナンス",
        overdue: "期限超過のメンテナンス",
        addTask: "メンテナンスタスクを追加",
        taskDetails: {
          type: "メンテナンス種別",
          dueDate: "期限日",
          estimatedCost: "予定費用",
          assignedTo: "担当者",
          priority: "優先度",
          notes: "タスクメモ"
        },
        intervals: {
          daily: "毎日",
          weekly: "毎週",
          monthly: "毎月",
          quarterly: "四半期",
          yearly: "毎年",
          custom: "カスタム間隔"
        }
      },
      inspectionSchedule: {
        title: "点検スケジュール",
        upcoming: "予定されている点検",
        overdue: "期限超過の点検",
        schedule: {
          title: "点検を予定",
          selectDate: "日付を選択",
          selectTime: "時間を選択",
          inspector: "担当点検者",
          type: "点検種別",
          notes: "点検メモ"
        },
        status: {
          scheduled: "予定済み",
          inProgress: "進行中",
          completed: "完了",
          cancelled: "キャンセル",
          overdue: "期限超過"
        },
        frequency: {
          weekly: "毎週",
          biweekly: "隔週",
          monthly: "毎月",
          quarterly: "四半期",
          custom: "カスタムスケジュール"
        }
      }
    },
    plateNumber: "ナンバープレート",
    name: "車両名",
    details: {
      title: "車両情報",
      model: "モデル",
      year: "年式",
      statusActive: "ステータス：稼働中",
      assignmentSection: "割り当てと点検",
      lastInspection: "前回の点検",
      assignedTo: "担当者",
      maintenanceHistory: "整備履歴",
      plate: "ナンバープレート",
      vin: "車台番号",
      status: "ステータス",
      maintenance: {
        title: "メンテナンス",
        schedule: "メンテナンススケジュール",
        history: {
          title: "メンテナンス履歴",
          serviceCenter: "サービスセンター",
          serviceDate: "サービス日",
          performedBy: "実施者",
        },
        costs: {
          title: "メンテナンスコスト",
          amount: "金額",
          total: "合計コスト",
          average: "平均コスト"
        },
        maintenanceTypes: {
          inspection: "点検",
          oilChange: "オイル交換",
          tireRotation: "タイヤローテーション",
          brakeService: "ブレーキ整備",
          generalService: "一般整備"
        },
        status: {
          scheduled: "予定済み",
          inProgress: "進行中",
          completed: "完了",
          cancelled: "キャンセル",
          overdue: "期限超過"
        }
      },
      inspections: {
        title: "点検スケジュール",
        upcoming: "予定されている点検",
        schedule: "点検を予約",
        reschedule: "予約変更",
        cancel: "点検をキャンセル",
        date: "日付",
        time: "時間",
        status: "状態",
        actions: "操作"
      }
    },
    alerts: {
      maintenanceDue: "メンテナンスまで残り{days}日",
      documentExpiring: "{document}の有効期限まで残り{days}日",
      inspectionRequired: "{date}までに点検が必要です",
      mileageThreshold: "走行距離の閾値に達しました",
    },
    list: {
      active: "稼働中の車両",
      noVehicles: "車両が見つかりません",
    },
  },
  inspections: {
    title: "車両点検",
    new: {
      title: "新規点検",
      start: "点検開始",
      selectVehicle: "車両を選択",
      vehicleDetails: "車両詳細",
      instructions: "チェックリストに従って必要項目を全て完了してください",
    },
    details: {
      title: "点検詳細",
      inspector: "点検者",
      date: "点検日",
      status: "状態",
      notes: "メモ",
      photos: "写真",
      documents: "書類",
      signature: "署名",
      completed: "完了",
      failed: "不合格項目",
      passed: "合格項目",
      noIssues: "問題なし",
      issues: "問題あり",
      vehicleInformation: "車両情報",
    },
    schedule: {
      title: "点検スケジュール",
      upcoming: "予定されている点検",
      overdue: "期限超過の点検",
      new: {
        title: "新規点検を予約",
        vehicle: "車両を選択",
        inspector: "点検者を割り当て",
        datetime: "日時を選択"
      },
      status: {
        scheduled: "予定済み",
        inProgress: "進行中",
        completed: "完了",
        cancelled: "キャンセル",
        overdue: "期限超過"
      },
      actions: {
        schedule: "点検を予約",
        reschedule: "予約を変更",
        cancel: "点検をキャンセル",
        confirm: "予約を確定"
      },
      notifications: {
        reminder: "点検リマインダー",
        scheduled: "点検が予約されました",
        cancelled: "点検がキャンセルされました"
      },
      selectTime: "時間選択",
      reschedule: "予定変更",
      cancel: "点検キャンセル",
      selectTimeSlot: "時間枠を選択",
      submit: "点検を提出",
      cancelConfirm: "この点検をキャンセルしてもよろしいですか？この操作は取り消せません。"
    },
    sections: {
      front: "前部",
      left: "左側",
      right: "右側",
      rear: "後部",
      interior: "内装",
      results: {
        resultStatus: {
          passed: "合格",
          failed: "不合格",
          na: "該当なし",
          pending: "保留"
        }
      }
    },
    components: {
      checklist: {
        title: "点検チェックリスト",
        section: "セクション",
        item: "項目",
        checklistStatus: {
          passed: "合格",
          failed: "不合格",
          na: "該当なし",
          pending: "保留"
        },
        comments: "コメント",
        addComment: "コメントを追加",
        markAllPassed: "全て合格にする",
        requiredItems: "必須項目",
        optionalItems: "任意項目",
        incompleteItems: "未完了項目",
        reviewRequired: "確認が必要",
        items: {
          front: {
            headlights: "ヘッドライト",
            signals: "ウインカー",
            bumper: "フロントバンパー",
            hood: "ボンネット",
            windshield: "フロントガラス"
          },
          sides: {
            mirrors: "サイドミラー",
            doors: "ドア",
            tires: "タイヤ",
            trim: "ボディトリム"
          },
          rear: {
            taillights: "テールライト",
            trunk: "トランク",
            exhaust: "排気システム",
            bumper: "リアバンパー"
          }
        }
      },
      photos: {
        title: "写真",
        addPhoto: "写真を追加",
        photoCount: "写真{count}枚",
        requiredCount: "写真が{count}枚必要です",
        retake: "撮り直し",
        preview: "プレビュー",
        takePhoto: "写真を撮る",
        upload: "アップロード",
        instructions: "車両の写真を撮影またはアップロードしてください",
        camera: {
          flip: "カメラを切り替え",
          flash: "フラッシュ切り替え",
          capture: "撮影",
          retake: "撮り直し",
        },
      },
      voiceNotes: {
        title: "音声メモ",
        record: "録音",
        instructions: "点検に関する音声メモを録音してください",
        play: "再生",
        stop: "停止",
        delete: "削除",
      },
      signature: {
        title: "署名",
        instructions: "点検を完了するにはここに署名してください"
      },
      timer: {
        elapsed: "経過時間",
        remaining: "残り時間",
        overtime: "超過時間",
        pause: "一時停止",
        resume: "再開",
        reset: "リセット",
      },
      location: {
        current: "現在地",
        updating: "位置情報を更新中...",
        accuracy: "精度: {meters}m",
        unavailable: "位置情報が利用できません",
        permission: "位置情報の許可が必要です",
      },
    },
    workflow: {
      title: "ワークフロー",
      preparation: "準備",
      inspection: "点検",
      review: "確認",
      completion: "完了",
      next: "次のステップ",
      previous: "前のステップ",
      skipStep: "このステップをスキップ",
    },
    validation: {
      incompleteItems: "すべての点検項目を完了してください",
      missingPhotos: "必要な写真が不足しています",
      missingSignature: "点検者の署名が必要です"
    },
    status: {
      completed: "完了",
      pending: "保留中",
      failed: "不合格",
      inProgress: "進行中",
    },
    progress: {
      title: "点検の進捗",
      completed: "0% 完了",
      remaining: "16 残り",
      stats: {
        passed: "0 合格",
        failed: "0 不合格",
        remaining: "16 残り"
      }
    },
    actionButtons: {
      cancel: "キャンセル",
      completeInspection: "完了"
    },
    history: {
      title: "点検履歴",
      allStatuses: "すべてのステータス"
    },
    notes: "点検メモ",
    newInspection: "新規点検",
    vehicleInformationTitle: "車両情報",
    vehicleInformationSubtitle: "トヨタ アルファード Zクラス",
    progressCompleted: "0% 完了",
    progressStatsPassed: "0 合格",
    progressStatsFailed: "0 不合格",
    progressStatsRemaining: "残り 16",
    back: {
      toInspections: "点検一覧に戻る"
    },
    inspectionChecklist: "点検チェックリスト",
    items: {
      f1: "前部項目1",
      f2: "前部項目2",
      f3: "前部項目3",
      f4: "前部項目4"
    },
    photos: {
      title: "写真",
      takePhoto: "写真を撮る",
      upload: "アップロード"
    },
    voice: {
      title: "音声メモ"
    },
    signature: {
      title: "署名",
      instructions: "点検を完了するにはここに署名してください"
    },
    pdfReport: {
      title: "点検レポート",
      summary: "点検概要",
      details: {
        vehicle: "車両詳細",
        inspection: "点検詳細",
        inspector: "点検者情報"
      },
      sections: {
        checklist: "点検チェックリスト",
        photos: "写真記録",
        notes: "点検者メモ",
        signature: "電子署名"
      },
      metadata: {
        generated: "作成日時",
        reportId: "レポートID",
        location: "場所",
        duration: "点検時間"
      },
      actions: {
        download: "PDFをダウンロード",
        print: "レポートを印刷",
        share: "レポートを共有",
        archive: "レポートをアーカイブ"
      },
      status: {
        draft: "下書きレポート",
        final: "最終レポート",
        archived: "アーカイブ済みレポート"
      }
    },
    start: {
      title: "新規点検開始",
      subtitle: "必須セクションをすべて完了してください",
      vehicle: {
        title: "車両情報",
        select: "車両を選択",
        details: "車両詳細",
        noVehicle: "車両が選択されていません"
      },
      preparation: {
        title: "準備",
        instructions: "点検開始前の確認事項：",
        items: [
          "車両が安全に駐車されていることを確認",
          "照明条件を確認",
          "点検用具を準備"
        ]
      },
      sections: {
        required: "必須セクション",
        optional: "任意セクション",
        incomplete: "未完了セクション",
        complete: "完了セクション"
      },
      progress: {
        status: "点検状況",
        completed: "{total}中{count}完了",
        remaining: "残り{count}セクション"
      },
      actions: {
        start: "点検開始",
        continue: "点検を続ける",
        save: "進捗を保存",
        complete: "点検を完了"
      },
      validation: {
        vehicleRequired: "車両を選択してください",
        confirmStart: "点検を開始する準備はできましたか？"
      }
    },
    date: "点検日",
    inspector: "点検者",
    vehicleInformation: "車両情報",
    completeInspections: "点検完了",
    completeInspection: "点検を完了",
    results: {
      inspectionStatus: {
        passed: "合格",
        failed: "不合格",
        na: "該当なし",
        pending: "保留"
      }
    },
    vehicleInspection: {
      checkStatus: {
        passed: "合格",
        failed: "不合格",
        na: "該当なし",
        pending: "保留"
      }
    },
    maintenanceSchedule: {
      maintenanceStatus: {
        upcoming: "予定",
        scheduled: "予定済み",
        inProgress: "進行中",
        completed: "完了",
        cancelled: "キャンセル",
        overdue: "期限超過"
      }
    },
    validationResults: {
      validationStatus: {
        passed: "合格",
        failed: "不合格",
        na: "該当なし",
        pending: "保留"
      }
    }
  },
  settings: {
    title: "設定",
    description: "アカウント設定と環境設定を管理します。",
    profile: {
      title: "プロフィール",
      description: "プロフィール情報を更新します。",
      name: "名前",
      email: "メールアドレス",
      emailNote: "メールアドレスはGoogleアカウントで管理されています。",
      updated: "プロフィールが更新されました。",
    },
    preferences: {
      title: "環境設定",
      theme: "テーマ",
      dateFormat: "日付形式",
      timeFormat: "時刻形式",
      timezone: "タイムゾーン",
      language: "言語",
    },
    notifications: {
      title: "通知設定",
      email: "メール通知",
      push: "プッシュ通知",
      sms: "SMS通知",
      frequency: "通知頻度",
      types: {
        maintenance: "メンテナンスアラート",
        inspection: "点検リマインダー",
        document: "書類期限",
        system: "システム更新",
      },
    },
  },
  auth: {
    signIn: "サインイン",
    signOut: "サインアウト",
    forgotPassword: "パスワードをお忘れですか？",
    resetPassword: "パスワードをリセット",
    newPassword: "新しいパスワード",
    confirmPassword: "パスワードを確認",
    passwordMismatch: "パスワードが一致しません",
    invalidCredentials: "メールアドレスまたはパスワードが無効です",
    roles: {
      admin: "管理者",
      driver: "ドライバー",
      manager: "マネージャー",
    },
    twoFactor: {
      title: "二要素認証",
      enterCode: "認証コードを入力",
      sendCode: "コードを送信",
      verifyCode: "コードを確認",
      setupInstructions: "二要素認証を設定",
    },
    session: {
      expired: "セッションが切れました。再度サインインしてください",
      invalid: "無効なセッション",
    },
    password: "パスワード",
    signInDescription: "メールアドレスとパスワードでサインイン",
    orContinueWith: "または",
    email: "メールアドレス",
    emailPlaceholder: "メールアドレスを入力",
    passwordPlaceholder: "パスワードを入力",
    signInWithGoogle: "Googleでサインイン",
    loginFailed: "ログインに失敗しました",
    googleSignInFailed: "Googleログインに失敗しました。もう一度お試しください。"
  },
  buttons: {
    backToVehicles: "車両一覧に戻る",
    startInspection: "点検を開始",
    save: "保存",
    cancel: "キャンセル",
    next: "次へ",
    previous: "前へ",
    complete: "完了"
  },
  nav: {
    dashboard: "ダッシュボード",
    vehicles: "車両一覧",
    inspections: "点検一覧",
    settings: "設定"
  },
  errors: {
    somethingWentWrong: "エラーが発生しました",
    tryAgain: "再試行",
    required: "この項目は必須です",
  },
  globalStatus: {
    active: "稼働中",
    inactive: "非稼働",
    pending: "保留中",
    completed: "完了",
    cancelled: "キャンセル",
    inProgress: "進行中",
    approved: "承認済み",
    rejected: "却下",
    archived: "アーカイブ済み",
    scheduled: "予定済み"
  }
} 