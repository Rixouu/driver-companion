import type { Translations } from '../types'

export const ja: Translations = {
  common: {
    status: {
      inProgress: "進行中",
      upcoming: "予定",
      recent: "最近",
      active: "稼働中",
      inactive: "非稼働",
      completed: "完了",
      scheduled: "予定",
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
    search: "検索",
    filter: "フィルター",
    all: "すべて",
    noResults: "結果が見つかりません",
    details: "詳細",
    actions: "アクション",
    viewDetails: "詳細を表示",
    addNew: "新規追加",
    backTo: "一覧に戻る",
    backToList: "一覧に戻る",
    saving: "保存中...",
    update: "更新",
    create: "作成",
    deleting: "削除中...",
    menu: "メニュー",
    login: "ログイン",
    logout: "ログアウト",
    inProgress: "進行中",
    upcoming: "予定",
    recent: "最近",
    total: "合計"
  },
  navigation: {
    dashboard: "ダッシュボード",
    vehicles: "車両",
    maintenance: "メンテナンス",
    inspections: "点検",
    settings: "設定",
    reporting: "レポート",
  },
  settings: {
    title: "設定",
    description: "アカウント設定と環境設定を管理",
    profile: {
      title: "プロフィール",
      description: "アカウント設定を管理",
      name: "名前",
      email: "メールアドレス",
      emailDescription: "メールアドレスは通知とサインインに使用されます"
    },
    preferences: {
      title: "環境設定",
      description: "アプリケーションの表示設定をカスタマイズ",
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
    status: {
      active: "稼働中",
      maintenance: "メンテナンス中",
      inactive: "非稼働"
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
    }
  },
  maintenance: {
    title: "メンテナンス",
    description: "車両メンテナンスのスケジュールと管理",
    addTask: "メンテナンスを追加",
    newTask: "新規メンテナンスタスク",
    editTask: "メンテナンスタスクを編集",
    searchPlaceholder: "メンテナンスタスクを検索...",
    noTasks: "メンテナンスタスクが見つかりません",
    status: {
      pending: "未着手",
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
      createSuccess: "メンテナンスタスクを作成しました",
      updateSuccess: "メンテナンスタスクを更新しました",
      deleteSuccess: "メンテナンスタスクを削除しました",
      taskStarted: "メンテナンスタスクを開始しました",
      error: "メンテナンスタスクの保存に失敗しました"
    },
    actions: {
      markComplete: "完了としてマーク",
      markInProgress: "進行中としてマーク",
      startTask: "タスクを開始",
      cancel: "タスクをキャンセル",
      edit: "タスクを編集",
      delete: "タスクを削除"
    },
    schedule: {
      title: "メンテナンスを予約",
      details: "メンテナンスタスクの詳細",
      description: "新規メンテナンスタスクを予約",
      button: "メンテナンスを予約"
    },
    createDirect: "直接作成",
  },
  inspections: {
    title: "点検予約",
    description: "新規点検予約の登録",
    addInspection: "点検を追加",
    newInspection: "新規点検",
    editInspection: "点検を編集",
    searchPlaceholder: "点検を検索...",
    noInspections: "点検が見つかりません",
    createDirect: "直接作成",
    status: {
      scheduled: "予定済み",
      in_progress: "進行中",
      completed: "完了",
      cancelled: "キャンセル"
    },
    type: {
      select: "点検タイプを選択",
      routine: "定期点検",
      safety: "安全点検",
      maintenance: "メンテナンス点検",
      description: {
        routine: "車両システムの総合チェック",
        safety: "重要な安全システムの点検",
        maintenance: "定期メンテナンス点検"
      }
    },
    sections: {
      suspension: {
        title: "サスペンションシステム",
        description: "サスペンション部品と動作の点検",
        items: {
          shock_absorbers: {
            title: "ショックアブソーバー",
            description: "漏れ、損傷、適切な動作の確認"
          },
          springs: {
            title: "スプリング",
            description: "亀裂、破損、適切な高さの点検"
          },
          bushings: {
            title: "ブッシュ",
            description: "摩耗、劣化、アライメントの確認"
          },
          ball_joints: {
            title: "ボールジョイント",
            description: "ジョイントの遊びと摩耗の点検"
          }
        }
      },
      lighting: {
        title: "ライティングシステム",
        description: "車両照明システムの点検",
        items: {
          taillights: {
            title: "テールライト",
            description: "ブレーキライト、車幅灯、バックライトの作動確認"
          },
          turn_indicators: {
            title: "方向指示器",
            description: "ウインカーとハザードランプの作動確認"
          },
          headlights: {
            title: "ヘッドライト",
            description: "ハイビーム・ロービームの動作、照準、明るさの確認"
          }
        }
      },
      tires: {
        title: "タイヤシステム",
        description: "タイヤとホイールの点検",
        items: {
          tread_depth: {
            title: "溝深さ",
            description: "タイヤ溝深さの測定と確認"
          },
          tire_pressure: {
            title: "空気圧",
            description: "空気圧の確認と調整"
          },
          tire_condition: {
            title: "タイヤの状態",
            description: "切り傷、膨らみ、摩耗パターンの点検"
          },
          wheel_alignment: {
            title: "ホイールアライメント",
            description: "タイヤの位置調整とバランスの確認"
          },
          wear_pattern: {
            title: "摩耗パターン",
            description: "アライメントやバランスの問題によるタイヤの摩耗パターンを点検"
          }
        }
      },
      engine: {
        title: "エンジンシステム",
        description: "エンジンと関連部品の点検",
        items: {
          oil_level: {
            title: "オイルレベル",
            description: "エンジンオイルの量と状態の確認"
          },
          coolant_level: {
            title: "冷却水レベル",
            description: "リザーバータンクの冷却水量と状態を確認"
          },
          belts: {
            title: "ベルト類",
            description: "全ベルトの状態と張りの確認"
          },
          drive_belts: {
            title: "ドライブベルト",
            description: "全てのドライブベルトの状態と張りを点検"
          },
          hoses: {
            title: "ホース類",
            description: "全ホースの漏れと摩耗の点検"
          },
          fluid_leaks: {
            title: "オイル漏れ",
            description: "オイル、冷却水、その他の液体漏れを確認"
          }
        }
      },
      transmission: {
        title: "トランスミッションシステム",
        description: "トランスミッションと駆動系の点検",
        items: {
          transmission_fluid: {
            title: "トランスミッションオイル",
            description: "オイルレベル、色、状態を確認"
          },
          shifting_operation: {
            title: "変速操作",
            description: "全ギアのスムーズな変速操作を確認"
          },
          clutch_operation: {
            title: "クラッチ操作",
            description: "クラッチの噛み合いと解放を確認"
          },
          leaks: {
            title: "オイル漏れ",
            description: "トランスミッションオイルの漏れ点検"
          }
        }
      },
      electrical: {
        title: "電装システム",
        description: "車両電装系統の点検",
        items: {
          battery_condition: {
            title: "バッテリー状態",
            description: "バッテリー電圧と端子の確認"
          },
          alternator_output: {
            title: "オルタネーター出力",
            description: "充電システムの動作確認"
          },
          starter_operation: {
            title: "スターター動作",
            description: "スターターモーターの機能と噛み合いを確認"
          }
        }
      },
      steering_system: {
        title: "ステアリングシステム",
        description: "ステアリング部品と操作の点検",
        items: {
          steering_wheel: {
            title: "ステアリングホイール",
            description: "遊び、アライメント、スムーズな操作の確認"
          },
          power_steering: {
            title: "パワーステアリング",
            description: "オイル量、漏れ、作動状態の点検"
          },
          steering_column: {
            title: "ステアリングコラム",
            description: "適切な動きと固定状態の点検"
          }
        }
      },
      brake_system: {
        title: "ブレーキシステム",
        description: "ブレーキシステムの点検",
        items: {
          brake_pedal: {
            title: "ブレーキペダル",
            description: "ブレーキペダルの高さ、遊び、作動応答の確認"
          },
          brake_discs: {
            title: "ブレーキディスク",
            description: "ブレーキディスクの摩耗、スコアリング、厚さの点検"
          },
          brake_fluid: {
            title: "ブレーキフルード",
            description: "マスターシリンダー内のブレーキフルードの液量と状態の点検"
          }
        }
      },
      safety_equipment: {
        title: "安全装備",
        description: "車両安全システムの点検",
        items: {
          seatbelt_operation: {
            title: "シートベルト操作",
            description: "全シートベルトの適切な動作と状態を確認"
          },
          airbag_system: {
            title: "エアバッグシステム",
            description: "エアバッグ警告灯とシステム状態を確認"
          },
          wiper_operation: {
            title: "ワイパー操作",
            description: "ワイパーとウォッシャー液の機能を確認"
          }
        }
      },
      brake_safety: {
        title: "ブレーキ安全点検",
        description: "重要なブレーキ安全性の点検",
        items: {
          emergency_brake: {
            title: "緊急ブレーキ",
            description: "緊急ブレーキの作動と効果の確認"
          },
          brake_lines: {
            title: "ブレーキライン",
            description: "ブレーキラインの漏れ、腐食、取り付け状態の点検"
          },
          abs_system: {
            title: "ABSシステム",
            description: "アンチロックブレーキシステムの作動と警告表示の確認"
          }
        }
      },
      restraint_systems: {
        title: "乗員保護装置",
        description: "車両乗員安全システムの点検",
        items: {
          seatbelt_condition: {
            title: "シートベルトの状態",
            description: "全シートベルトの摩耗、損傷、巻き取り機能の点検"
          },
          airbag_indicators: {
            title: "エアバッグ表示",
            description: "エアバッグシステムの警告灯と診断コードの確認"
          },
          child_locks: {
            title: "チャイルドロック",
            description: "後部ドアのチャイルドセーフティロックの動作確認"
          }
        }
      },
      visibility: {
        title: "視界システム",
        description: "車両の視界とガラスの点検",
        items: {
          windshield_condition: {
            title: "フロントガラスの状態",
            description: "ひび割れ、欠け、視界障害の確認"
          },
          mirror_condition: {
            title: "ミラーの状態",
            description: "全ミラーの清明度、調整、取り付け状態の点検"
          },
          window_operation: {
            title: "窓の動作",
            description: "全パワーウィンドウのスムーズな動作と完全閉鎖の確認"
          }
        }
      },
      scheduled_maintenance: {
        title: "定期メンテナンス",
        description: "定期的なメンテナンス項目",
        items: {
          oil_change: {
            title: "オイル交換",
            description: "スケジュールに従ったエンジンオイルとフィルターの交換"
          },
          filter_replacement: {
            title: "フィルター交換",
            description: "エア、燃料、キャビンフィルターの必要に応じた交換"
          },
          fluid_levels: {
            title: "液体類の量",
            description: "全車両液体の適切なレベルまでの補充と確認"
          }
        }
      },
      wear_items: {
        title: "消耗品",
        description: "通常の摩耗が発生する部品の点検",
        items: {
          brake_pads: {
            title: "ブレーキパッド",
            description: "ブレーキパッドの厚さと摩耗パターンの測定"
          },
          tire_rotation: {
            title: "タイヤローテーション",
            description: "均一な摩耗と最適な性能のためのタイヤローテーション"
          },
          belt_condition: {
            title: "ベルトの状態",
            description: "全駆動ベルトの摩耗、張り、アライメントの点検"
          }
        }
      },
      diagnostics: {
        title: "診断",
        description: "電子システムの診断テスト",
        items: {
          computer_scan: {
            title: "コンピュータ診断",
            description: "エラーコードの電子診断スキャンの実施"
          },
          sensor_check: {
            title: "センサーチェック",
            description: "全車両センサーとモジュールの動作確認"
          },
          emissions_test: {
            title: "排出ガス試験",
            description: "排気ガスとシステム性能の確認"
          }
        }
      },
    },
    actions: {
      pass: "合格",
      fail: "不合格",
      complete: "完了",
      markComplete: "完了としてマーク",
      markInProgress: "進行中としてマーク",
      startInspection: "点検を開始",
      cancel: "キャンセル",
      edit: "編集",
      delete: "削除",
      addPhoto: "写真を追加",
      addNotes: "メモを追加",
      resume: "再開",
      scheduleRepair: "修理を予約",
      needsRepair: "修理が必要",
      scheduleRepairDescription: "不合格項目の修理タスクを予約して、車両を最適な状態に保ちましょう。"
    },
    fields: {
      vehicle: "車両",
      vehicleDescription: "点検する車両を選択してください",
      vehiclePlaceholder: "車両を選択",
      date: "点検日",
      dateDescription: "点検を実施する日",
      datePlaceholder: "日付を選択",
      type: "点検タイプ",
      typeDescription: "実施する点検のタイプ",
      status: "ステータス",
      statusDescription: "点検の現在の状態",
      notes: "メモ",
      notesPlaceholder: "この項目についてのメモを追加...",
      notesDescription: "点検に関する追加のメモ",
      generalNotesPlaceholder: "この点検に関する一般的なメモを追加...",
      photoRequired: "写真必須",
      photo: "写真",
      photos: "写真",
      photoDescription: "点検の証拠写真",
      inspector: "点検者",
      inspectorDescription: "点検を実施する担当者"
    },
    details: {
      title: "点検詳細",
      description: "点検の詳細と結果を表示",
      inspectionProgress: "点検の進捗",
      inspectionDetails: "点検詳細",
      vehicleDetails: "車両詳細",
      inspectionItems: "点検項目",
      noItems: "点検項目が追加されていません",
      scheduledFor: "{date}に予定",
      printTitle: "点検レポート",
      vehicleInfo: {
        title: "車両情報",
        plateNumber: "ナンバープレート",
        brand: "メーカー",
        model: "モデル",
        year: "年式",
        vin: "車台番号",
        noImage: "画像なし"
      },
      photos: {
        title: "点検写真",
        noPhotos: "写真なし",
        viewOriginal: "元の画像を表示",
        downloadPhoto: "写真をダウンロード",
        deletePhoto: "写真を削除",
        confirmDelete: "この写真を削除してもよろしいですか？",
        addMore: "写真を追加"
      },
      status: {
        title: "ステータス",
        completed: "{date}に完了",
        in_progress: "{date}に開始",
        scheduled: "{date}に予定",
        cancelled: "{date}にキャンセル"
      },
      inspector: {
        title: "点検者",
        assigned: "{name}が担当",
        contact: "連絡先",
        phone: "電話番号",
        email: "メールアドレス"
      },
      results: {
        title: "点検結果",
        summary: "概要",
        passCount: "{count}項目合格",
        failCount: "{count}項目不合格",
        pendingCount: "{count}項目保留中",
        photoCount: "{count}枚の写真",
        notesCount: "{count}件のメモ",
        completionRate: "完了率",
        lastUpdated: "最終更新",
        allPassed: "すべての項目に合格",
        noFailedItems: "この点検では不合格項目はありません。すべての項目が正常に合格しました。",
        failedItemsFound: "{count}件の不合格項目があります",
        failedItemsDescription: "以下の項目は点検に不合格となり、注意または修理が必要な場合があります。"
      },
      sections: {
        title: "点検セクション",
        noSections: "セクションなし",
        viewAll: "全セクションを表示",
        collapse: "全て折りたたむ",
        expand: "全て展開"
      },
      actions: {
        edit: "点検を編集",
        delete: "点検を削除",
        print: "レポート印刷",
        export: "結果をエクスポート",
        share: "結果を共有"
      },
      tabs: {
        details: "点検詳細",
        failed: "不合格項目",
        passed: "合格項目"
      }
    },
    messages: {
      error: "エラー",
      createSuccess: "点検が正常に作成されました",
      updateSuccess: "点検が正常に更新されました",
      selectVehicle: "車両を選択してください",
      loginRequired: "点検を作成するにはログインする必要があります",
      tryAgain: "もう一度お試しください",
      photoAdded: "写真が追加されました",
      photoUploadError: "写真のアップロードに失敗しました。もう一度お試しください。",
      printStarted: "印刷ダイアログが開きました",
      exportSuccess: "点検が正常にエクスポートされました",
      exportError: "点検のエクスポート中にエラーが発生しました"
    },
    templates: {
      routine: {
        title: "定期車両点検",
        description: "全車両システムの総合点検"
      },
      safety: {
        title: "安全システム点検",
        description: "重要な安全部品のチェック"
      },
      maintenance: {
        title: "メンテナンス点検",
        description: "定期メンテナンス確認"
      }
    },
    categories: {
      steering_system: {
        name: "サスペンションシステム",
        description: "サスペンション部品と動作の点検"
      },
      suspension_system: {
        name: "サスペンションシステム",
        description: "サスペンション部品と動作の点検"
      },
      lighting_system: {
        name: "ライティングシステム",
        description: "車両照明システムの点検"
      },
      tire_system: {
        name: "タイヤシステム",
        description: "タイヤとホイールの点検"
      },
      engine_system: {
        name: "エンジンシステム",
        description: "エンジンと関連部品の点検"
      },
      transmission_system: {
        name: "トランスミッションシステム",
        description: "トランスミッションと駆動系の点検"
      },
      electrical_system: {
        name: "電装システム",
        description: "車両電装系統の点検"
      },
      safety_equipment: {
        name: "安全装備",
        description: "車両安全システムの点検"
      },
      brake_system: {
        name: "ブレーキシステム",
        description: "ブレーキシステムの点検"
      }
    },
    schedule: {
      title: "点検を予約",
      description: "車両と日付を選択して新しい点検を予約",
      selectDate: "点検日を選択",
      datePlaceholder: "日付を選択",
      cancel: "キャンセル",
      button: "点検を予約",
      details: "点検の詳細",
      backToInspections: "点検一覧に戻る"
    },
    defaultType: "標準点検",
  },
  dashboard: {
    title: "ダッシュボード",
    description: "車両管理の概要と活動状況",
    quickActions: {
      title: "クイックアクション",
      description: "よく使う機能",
      addVehicle: "車両を追加",
      scheduleMaintenance: "メンテナンス予約",
      scheduleInspection: "点検予約",
      viewReports: "レポート表示"
    },
    maintenance: {
      title: "メンテナンス",
      description: "メンテナンスタスクの概要"
    },
    inspections: {
      title: "点検",
      description: "車両点検の概要"
    },
    stats: {
      totalVehicles: "総車両数",
      maintenanceTasks: "メンテナンスタスク",
      inspections: "点検",
      activeVehicles: "稼働中の車両"
    },
    sections: {
      maintenanceSchedule: {
        title: "メンテナンススケジュール",
        noPending: "予定されているメンテナンスはありません"
      },
      inspectionSchedule: {
        title: "点検スケジュール",
        noPending: "予定されている点検はありません"
      },
      recentMaintenance: {
        title: "最近のメンテナンス",
        noCompleted: "完了したメンテナンスはありません"
      },
      recentInspections: {
        title: "最近の点検",
        noCompleted: "完了した点検はありません"
      }
    },
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
    }
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
  labels: {
    due: "{date}まで",
    priority: {
      high: "高",
      medium: "中",
      low: "低"
    },
    status: {
      scheduled: "予定済み",
      inProgress: "進行中"
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
} as const 