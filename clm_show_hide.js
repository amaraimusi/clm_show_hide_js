/**
 * 列表示切替クラス 
 * 
 * 初期化(init)を実行すると、対象HTMLテーブルの列から、列表示切替チェックボックスを自動生成します。
 * 列表示切替チェックボックスにチェックを入れると列の表示を切り替えられます。
 * 
 * ◇主なメソッド
 * - init 初期化
 * - refresh 一覧テーブルをリフレッシュする
 * 
 * @version 1.3.1
 * 
 * @date 2015-5-8 新規作成
 * @date 2015-11-24 「列表示を保存」ボタン押下後のメッセージ方式を修正。
 * @date 2015-11-27 テーブルを再構築するrefreshメソッドを追加
 * @date 2016-1-22 getCshAryメソッドを追加
 * 
 * @author k-uehara 
 */
var ClmShowHide =function(){


	/// コールバック関数用
	var my=this;

	/// デフォルト列データ
	this.defClmData=[];
	
	/// プロパティ
	this.props={};
	
	/// 初期列表示配列
	this.iniClmData={};
	
	/**
	 * 初期化
	 * @param tblId 対象テーブルのID属性
	 * @param chBoxsId 列表示切替チェックボックス群を出力する要素を指定
	 * @param iniClmData 初期列表示配列 例→iniClmData=[1,1,0,0,0,1];// 1:初期表示   0:初期非表示
	 * @param unique 画面毎に異なる一意なコード。省略時はtblIdを使用する。
	 *
	 */
	this.init=function(tblId,chBoxsId,iniClmData,unique){

		//引数をメンバのプロパティにセットする。
		this.props['tblId']=tblId;
		this.props['chBoxsId']=chBoxsId;
		this.props['unique']=unique;
		this.iniClmData = iniClmData;
		

		if(unique==null){
			unique=tblId;
		}

		var storage = localStorage;

		//列データをストレージから取得する。ストレージになければ初期列表示配列をセット
		var j_clmData=storage.getItem(unique + '_clmData');
		var clmData={};//列データ
		if(j_clmData =='' || j_clmData==null){
			clmData={};
			for(var i=0;i < iniClmData.length ;i++){
				var show_flg=iniClmData[i];
				var clm_ent={'clm_name':null,'show_flg':show_flg};
				clmData[i]=clm_ent;
			}
		}else{
			clmData=JSON.parse(j_clmData);
		}

		var i=0;
		$.each($('#' + tblId + " thead tr th"), function() {

			var clm_name=$(this).html();
			try{
				clmData[i]['clm_name']=clm_name;
			}catch( e ){
				  return;
			}

			i++;
		});

		this.defClmData = clmData;//メンバに列データをセット


		//列表示チェックボックスを作成
		this.createClmShowCheckBox_csh(tblId,chBoxsId,clmData);


		//列表示チェックボックスのクリックイベント。
		$(".csh_cb").click(function(event){
			var checked=$(this).prop('checked');
			var index=$(this).attr('index');

			//列表示の切替処理
			if(checked==true){
				my.clm_show_csh(tblId,index);//列表示
			}else{
				my.clm_hide_csh(tblId,index);//列非表示
			}

		});


		//列表示切替
		for (var i in clmData) {
			var clm_ent=clmData[i];

			//表示フラグ＝0ならその列を非表示にする。
			if(clm_ent['show_flg']==0){

				this.clm_hide_csh(tblId,i);//インデックスに紐づく列を非表示にする
			}

		}



		//列表示ボタンにイベントを追加。
		$("#" + tblId + "_save_btn").click(function(event){

			//列の表示状態をローカルストレージに保存
			my.saveClmData(tblId,chBoxsId,unique);

		});

		//「すべてチェック」ボタンにイベントを追加。
		$("#" + tblId + "_all_checked_btn").click(function(event){

			//すべての列表示チェックボックスにチェックを入れる。
			my.allChecked(tblId,chBoxsId,clmData);

		});

		//「初期に戻す」ボタンにイベントを追加。
		$("#" + tblId + "_default_btn").click(function(event){

			//列表示チェックボックスを初期状態に戻す。
			my.defaultClmCb(tblId,chBoxsId,iniClmData,unique);

		});


	};
	
	/**
	 * 列表示配列を取得
	 * 
	 * 列表示チェックボックスから列表示配列を取得する。
	 * @return 列表示配列
	 * 
	 */
	this.getCshAry = function(){
		
		chBoxsId=this.props.chBoxsId;
		

		var csh_ary=[];

		//列表示切替チェックボックス群から列データの表示フラグにセットする。
		for (var i in this.defClmData) {

			var cb=$("#" + chBoxsId + " input[type='checkbox']").eq(i);
			var checked= cb.prop('checked');

			if(checked==true){
				csh_ary.push(1);
			}else{
				csh_ary.push(0);
			}
		}
		
		return csh_ary;
	};
	
	/**
	 * 列表示切替情報を初期状態にリセットする
	 * 
	 * ローカルストレージ内の値もクリアする。
	 */
	this.reset=function(){
		
		//列表示チェックボックスを初期状態に戻す。
		this.defaultClmCb(this.props.tblId,this.props.chBoxsId,this.iniClmData,this.props.unique);

	};
	
	/**
	 * 一覧テーブルをリフレッシュする。
	 * 何らかの処理で崩れたテーブルを、現在の列表示状態に戻す。
	 */
	this.refresh=function(){
		
		var tblId = this.props.tblId;
		
		//一旦、列をすべて表示する
		for (var i in this.defClmData) {
			this.clm_show_csh(tblId,i);//列を表示
		}
		
		var clmData=this.getClmDataFromCheckbox();//列表示切替チェックボックス群から列データを取得する。
		
		for (var i in clmData) {
			
			var show_flg=clmData[i].show_flg;
			
			if(show_flg==1){
				this.clm_show_csh(tblId,i);//列表示
			}else{
				this.clm_hide_csh(tblId,i);//列非表示
			}

		}
		
		
	}
	


	//列表示チェックボックスを初期状態に戻す。
	this.defaultClmCb=function(tblId,chBoxsId,iniClmData,unique){
		for(var i=0;i < iniClmData.length ;i++){

			var show_flg=iniClmData[i];

			var cb=$("#" + chBoxsId + " input[type='checkbox']").eq(i);

			if(show_flg==1){
				cb.prop('checked',true);
				this.clm_show_csh(tblId,i);//列表示
			}else{
				cb.prop('checked',false);
				this.clm_hide_csh(tblId,i);//列非表示
			}


		}

		//ローカルストレージの列データをクリア
		var storage = localStorage;
		storage.removeItem(unique + '_clmData');


	};


	//すべての列表示チェックボックスにチェックを入れる。
	this.allChecked=function(tblId,chBoxsId,clmData){
		for (var i in clmData) {

			var cb=$("#" + chBoxsId + " input[type='checkbox']").eq(i);
			var checked= cb.prop('checked');

			if(checked==false){
				cb.prop('checked',true);//列表示チェックボックスにチェックを入れる。
				this.clm_show_csh(tblId,i);//列を表示
			}


		}

	};


	//列の表示状態をローカルストレージに保存
	this.saveClmData=function(tblId,chBoxsId,unique){

		var clmData=this.getClmDataFromCheckbox();//列表示切替チェックボックス群から列データを取得する。

		var j_clmData=JSON.stringify(clmData);


		//ローカルストレージに列データを保存
		var storage = localStorage;
		storage.setItem(unique + '_clmData',j_clmData);

		$('#csh_msg').show();
		$('#csh_msg').fadeOut(3000);
	};




	//列表示チェックボックスを作成
	this.createClmShowCheckBox_csh=function(tblId,chBoxsId,clmData){
		var cbs=$("#" + chBoxsId);
		cbs.empty();
		for (var i in clmData) {
			var clm_ent=clmData[i];

			var checked='';
			if(clm_ent['show_flg']==1){
				checked='checked'
			}

			var cb="<div class='csh_cb_div'><input type='checkbox' class='csh_cb' " + checked + " index='" + i + "' /><label>"  + clm_ent['clm_name'] + "</label></div>";

			cbs.append(cb);
		}

		cbs.append("<div style='clear:both'></div>");

		//列表示保存ボタンを作成
		var saveBtn="<div class='csh_func_btn'><input type='button' value='列表示を保存' id='" + tblId + "_save_btn' class='btn btn-primary btn-xs' /></div>";
		cbs.append(saveBtn);

		//すべてチェックボタンを作成
		var allCheckedBtn="<div class='csh_func_btn'><input type='button' value='すべてチェック' id='" + tblId + "_all_checked_btn' class='btn btn-primary btn-xs' /></div>";
		cbs.append(allCheckedBtn);

		//「初期に戻す」ボタンを作成
		var defaultBtn="<div class='csh_func_btn'><input type='button' value='初期に戻す' id='" + tblId + "_default_btn' class='btn btn-primary btn-xs' /></div>";
		cbs.append(defaultBtn);


		cbs.append("<div id='csh_msg' class='csh_func_btn' style='display:none;color:#de5246'>列の表示状態を記憶しました。</div>");

	};

	//列表示
	this.clm_show_csh=function(tblId,index){


		var th=$("#" + tblId + " thead tr th").eq(index);
		th.show();

		$.each($("#" + tblId + " tbody tr"), function() {

			var td=$(this).children();
			td.eq(index).show();

		});

	};



	//列非表示
	this.clm_hide_csh=function(tblId,index){
		var th=$("#" + tblId + " thead tr th").eq(index);
		th.hide();

		$.each($("#" + tblId + " tbody tr"), function() {

			var td=$(this).children();
			td.eq(index).hide();

		});
	};

	//列表示切替チェックボックス群から列データを取得する。
	this.getClmDataFromCheckbox = function(){
		
		chBoxsId=this.props.chBoxsId;

		//デフォルト列データから、列データを複製する。（クローンコピー）
		var clmData = $.extend(true, {}, this.defClmData);

		//列表示切替チェックボックス群から列データの表示フラグにセットする。
		for (var i in clmData) {

			var cb=$("#" + chBoxsId + " input[type='checkbox']").eq(i);
			var checked= cb.prop('checked');

			if(checked==true){
				clmData[i]['show_flg'] = 1;
			}else{
				clmData[i]['show_flg'] = 0;
			}
		}
		
		return clmData;
		
		
	};

};












